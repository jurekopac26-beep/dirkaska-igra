// NEW VERSION · TEST 1: driving on the water (the user's choice, 5. 11. 2026; docs/nova-mapa-voda.md). The course for jet skis (js/nvboat.js):
// the two jet skis at HOME's pier and a free one at the course's start can be taken. The car stopped on the shore by one (within K.TAKE m,
// slower than K.VTAKE m/s): a card at the top, TAKE THE JET SKI; the car waits there (held) and you ride the jet ski (js/missions/kit.js
// MisKit.boat, as the lifeguard's in mission 35: its own numbers on the water, steered with the player's controls, the camera behind it) on
// the course, along the canal under the ring road to the sea and on the sea along the coast. Here it slides (its motion turns after its nose:
// K.GRIP, sliding sheds speed), rides the waves (a chop on the course and the canal, a swell on the sea: K.CHOP, K.SWELL) and leans into the
// turns (K.LEAN). Slow by the land (within K.LAND m): BACK TO YOUR CAR, the car put on the shore there (facing the land), the jet ski left in
// the water (taken again from there). A restart at HOME: the car, the jet skis back at the pier and at the start.
// The car in the water (no jet ski): its ground under the water is the bed (the course's and the canal's as js/nvboat.js draws it, the sea's:
// H3.water.bedAt; a bridge's deck over the water stays), the shallow water slows it (MisKit.wade); in the deep (over K.DEEP m, sunk for
// K.SINK s) it goes back on the shore where it left it, facing the land (as Na progo puts a car back on the road): no damage, no VOZILO UNIČENO.
// Drawn: the jet skis not ridden all in one mesh (one draw call, made again when one is taken or left; js/nvboat.js's two at the pier taken
// out of the map's merged meshes), the ridden one in its own with its rider, the wake. Loaded with the new map (js/game.js nvStart); its hooks after the map's (init: before the still meshes are merged, js/nvbake.js), stepped
// with the race (step before the cars move: its event, e.g. NAZAJ NA OBALO, shown by the game), drawn between the steps (frame: the card).
const NVWater = (function () {
  'use strict';
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const K = { VMAX: 18, ACC: 11, BRAKE: 8, TURN: 1.6, DRAG: 0.25, GRIP: 4, SLIDE: 0.7, LEAN: 0.3, CHOP: 0.06, SWELL: 0.2, BUMP: 3,
    WADE: 2.2, TAKE: 12, VTAKE: 2.2, LAND: 3, VLAND: 2.6, WET: 0.12, DEEP: 0.75, SINK: 0.3, AWAY: 3, SHOW: 230, START: 3, STARTU: 4 };
  let H3 = null, trk = null, g0 = null, WL = -0.12, S = null, el = null, seaK = 0;

  // ---- the water where it is: its depth (m; 0 on the land), the sea or not, a jet ski's place or not
  function depth(x, z) {
    let d = 0; const C = H3 && H3.waterCourse, W = H3 && H3.water;
    if (C && C.depth) d = C.depth(x, z);
    if (W && W.region && W.bedAt) d = Math.max(d, seaDepth(W, x, z));
    return d > 0 ? d : 0;
  }
  // the sea's depth from a grid of SG.cs m over its outline, filled as it is asked for (its bed's look-up is slow, ~10 us: the car's ground
  // asks for it many times a step), between its corners linearly
  let SG = null;
  function seaDepth(W, x, z) {
    if (!SG) { const P = W.poly || [], cs = 2; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [a, b] of P) { x0 = Math.min(x0, a); x1 = Math.max(x1, a); z0 = Math.min(z0, b); z1 = Math.max(z1, b); }
      if (!P.length) { SG = { nx: 0 }; return 0; }
      const nx = Math.ceil((x1 - x0) / cs) + 1, nz = Math.ceil((z1 - z0) / cs) + 1; SG = { x0, z0, cs, nx, nz, a: new Float32Array((nx + 1) * (nz + 1)).fill(NaN) }; }
    if (!SG.nx) return 0;
    const fx = (x - SG.x0) / SG.cs, fz = (z - SG.z0) / SG.cs, i = Math.floor(fx), j = Math.floor(fz); if (i < 0 || j < 0 || i >= SG.nx || j >= SG.nz) return 0;
    const u = fx - i, v = fz - j, c = (ii, jj) => { const k = jj * (SG.nx + 1) + ii; let d = SG.a[k];
      if (d !== d) { const px = SG.x0 + ii * SG.cs, pz = SG.z0 + jj * SG.cs; d = W.region(px, pz) ? Math.max(0, W.WL - W.bedAt(px, pz).y) : 0; SG.a[k] = d; } return d; };
    return (c(i, j) * (1 - u) + c(i + 1, j) * u) * (1 - v) + (c(i, j + 1) * (1 - u) + c(i + 1, j + 1) * u) * v;
  }
  const seaAt = (x, z) => { const W = H3 && H3.water; return !!(W && W.region && W.bedAt && seaDepth(W, x, z) > 0.3); };
  const inMap = (x, z) => { const f = trk && trk.free; return !f || (x > f[0] + 3 && x < f[1] - 3 && z > f[2] + 3 && z < f[3] - 3); };
  const wet = (x, z) => inMap(x, z) && depth(x, z) >= K.WET;
  // the waves under a jet ski: a chop everywhere, the sea's swell where it is (seaK: eased in and out along the canal's mouth)
  const wave = (x, z, t) => K.CHOP * (0.55 * Math.sin(x * 0.9 + t * 2.3) + 0.45 * Math.sin(z * 0.75 - t * 1.9 + 1.3)) + K.SWELL * seaK * Math.sin((x * 0.55 + z * 0.84) / 9 - t * 1.25);

  // ---- the jet ski's look (js/nvboat.js jetski: hull, stripe, seat, handlebar, nose; the ridden one's mesh with its rider), the wake (only while ridden)
  let VC = null, WK = null;
  // a jet ski's simple bodies (with its rider: the ridden one) into a parts list, at the frame W (none: its own)
  function skiParts(B, col, W, rider) {
    const put = (g, m, c) => B.L.push({ g, m: W ? new THREE.Matrix4().multiplyMatrices(W, m) : m, c }), M = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z);
    const box = (x, y, z, lx, ly, lz, c) => put(new THREE.BoxGeometry(lx, ly, lz), M(x, y, z), c);
    box(0, 0.12, 0, 2.6, 0.42, 0.95, col); box(0, 0.3, 0, 2.62, 0.08, 0.97, 0xf4f4f0); box(-0.3, 0.42, 0, 1.0, 0.22, 0.42, 0x1c1c1e); box(0.55, 0.62, 0, 0.12, 0.08, 0.7, 0x2a2e34);
    const N = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(Math.PI / 4, 0, -Math.PI / 2)); N.scale(new THREE.Vector3(1, 1, 0.55)); N.setPosition(1.72, 0.12, 0); put(new THREE.ConeGeometry(0.48, 0.9, 4), N, col);
    if (rider) { box(-0.15, 0.95, 0, 0.42, 0.8, 0.5, 0x2a2e34); box(0.2, 0.95, 0.2, 0.5, 0.1, 0.1, 0xd9a77e); box(0.2, 0.95, -0.2, 0.5, 0.1, 0.1, 0xd9a77e); put(new THREE.SphereGeometry(0.2, 8, 6), M(-0.05, 1.5, 0), 0xf2c12e); }
  }
  // the ridden one: its own mesh with its rider (drawn only while ridden: MisKit.boat's o.mesh, not kept)
  function rideMesh(col) { const B = MisKit.parts(); skiParts(B, col, null, true); const m = B.mesh(VC); m.castShadow = true; m.userData.dyn = true; return m; }
  // the ones not ridden (at their places, or where they were left) all in one mesh: one draw call; made again when one is taken or left
  function idleBuild() {
    const B = MisKit.parts(), W = new THREE.Matrix4(); let n = 0;
    S.skis.forEach((sk, i) => { if (i === S.ride) return; W.makeRotationY(-sk.B.h); W.setPosition(sk.B.x, WL + 0.02, sk.B.z); skiParts(B, sk.col, W, false); n++; });
    const m = S.idle, g = n ? B.mesh(VC).geometry : new THREE.BufferGeometry(); if (m.geometry) m.geometry.dispose(); m.geometry = g; m.visible = n > 0; S.idleN = n;
  }
  function wakeMesh() {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1.2, 0, 0, -6.5, 0, -1.25, -6.5, 0, 1.25], 3)); g.setAttribute('color', new THREE.Float32BufferAttribute([1, 1, 1, 0.3, 0.6, 0.76, 0.3, 0.6, 0.76], 3));   // (white foam at the stern, fading into the water's blue)
    g.setIndex([0, 2, 1, 0, 1, 2]);
    const m = new THREE.Mesh(g, WK); m.position.y = -0.1; m.renderOrder = 3; m.userData.dyn = true; m.visible = false; return m;
  }

  // ---- the jet skis: js/nvboat.js's two at HOME's pier (theirs taken out of the scene before the merging: ours in their places), a free
  // one at the course's start (K.START m before its line, K.STARTU m in from the water's edge, on the side with the beach)
  function build() {
    const C = H3.waterCourse; if (!C || typeof THREE === 'undefined' || typeof Render === 'undefined' || !Render.scene) return null;
    if (!VC) { VC = new THREE.MeshLambertMaterial({ vertexColors: true }); WK = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.32, depthWrite: false }); }
    const run = { props: [], add(o) { if (!(o.userData && o.userData.misUndo)) Render.scene.add(o); this.props.push(o); return o; } }, list = [];
    for (const s of C.skis || []) { if (s.at !== 'pier') continue; if (s.g && s.g.parent) s.g.parent.remove(s.g); list.push(afloat({ x: s.x, z: s.z, h: s.h, col: s.col, at: 'pier' })); }
    const st = startSpot(C); if (st) list.push(st);
    const skis = list.map((s) => { const mesh = rideMesh(s.col), B = MisKit.boat(run, { x: s.x, z: s.z, h: s.h, y: WL + 0.02, vmax: K.VMAX, acc: K.ACC, brake: K.BRAKE, turn: K.TURN, drag: K.DRAG, wet, wave, mesh, keep: false, D: [15, 10.5] });
      B.cam = camOf(B); return { home: { x: s.x, z: s.z, h: s.h }, col: s.col, at: s.at, mesh, B }; });
    const idle = new THREE.Mesh(new THREE.BufferGeometry(), VC); idle.userData.dyn = true;   // (no shadow: no second draw call in the shadow's pass)
    Render.scene.add(idle);
    return { skis, idle, idleN: 0, wk: wakeMesh(), ride: -1, car: null, dry: null, sink: 0, mh: 0, roll: 0, zone: null, pick: null, near: -1, backs: 0, rides: 0, lands: 0 };
  }
  // (one moored in too shallow water for it to get away, by the pier's land end: nudged out towards the deeper water, at most 6 m)
  function afloat(s) {
    for (let k = 0; k < 24 && depth(s.x, s.z) < 0.2; k++) { let b = null, bd = -1;
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, x = s.x + Math.cos(a) * 0.25, z = s.z + Math.sin(a) * 0.25, d = depth(x, z); if (d > bd) { bd = d; b = [x, z]; } }
      s.x = b[0]; s.z = b[1]; }
    return s;
  }
  function startSpot(C) {
    const B = H3.boatC, Kl = C.K; if (!B || !B.dress || !Kl) return null;
    const at = (s) => { const A = Kl.A, P = Kl.P, L = Kl.L; s = ((s % L) + L) % L; let i = 1; while (i < A.length - 1 && A[i] < s) i++; const [ax, az] = P[i - 1], [bx, bz] = P[i], l = Math.hypot(bx - ax, bz - az) || 1, t = clamp((s - A[i - 1]) / ((A[i] - A[i - 1]) || 1), 0, 1);
      return { x: ax + (bx - ax) * t, z: az + (bz - az) * t, tx: (bx - ax) / l, tz: (bz - az) / l, h: Math.atan2(bz - az, bx - ax) }; };
    const p = at(B.dress.s0 - K.START), hw = (typeof NVBoat !== 'undefined' && NVBoat.HW) || 11;
    for (const sg of [-1, 1]) { const nx = -p.tz * sg, nz = p.tx * sg, x = p.x + nx * (hw - K.STARTU), z = p.z + nz * (hw - K.STARTU);
      if (C.dW(p.x + nx * (hw + 4), p.z + nz * (hw + 4)) > 2 && depth(x, z) >= K.WET * 2) return { x, z, h: p.h, col: 0xff7a1a, at: 'start' }; }
    return null;
  }
  // the camera behind the jet ski as behind the car (upright: higher and further back), a little ahead of it, the user's zoom and tilt
  function camOf(B) {
    return function (dt) {
      const Cm = Render.camera, Sh = B.shot; if (!Cm || !Sh) return;
      const up = Cm.aspect < 1, uc = Render.cam || {}, D = (up ? 15 : 10.5) * (uc.userZoom || 1), pitch = (up ? 0.5 : 0.36) * (1 - (uc.userTilt || 0)), a0 = up ? 4 : 3;
      B.hs += wrap(B.h - B.hs) * (1 - Math.exp(-dt * 3));
      const fx = Math.cos(B.hs), fz = Math.sin(B.hs), tx = B.x + fx * a0, tz = B.z + fz * a0, ty = WL + 0.8;
      Sh.tx = tx; Sh.ty = ty; Sh.tz = tz; Sh.px = tx - fx * D * Math.cos(pitch); Sh.pz = tz - fz * D * Math.cos(pitch); Sh.py = ty + D * Math.sin(pitch);
      Sh.fov = up ? 62 : 50; Sh.fogD = D * 1.4; Sh.gy = WL;
    };
  }

  // ---- onto the jet ski and back into the car
  function take(P, k) {
    const sk = S.skis[k]; if (!sk) return;
    S.car = { x: P.x, z: P.z, h: P.h }; S.ride = k; S.mh = sk.B.h; S.roll = 0; S.rides++; seaK = seaAt(sk.B.x, sk.B.z) ? 1 : 0;
    sk.mesh.add(S.wk); sk.B.v = 0; sk.B.go(true); sk.B.step(0, 0, 0, 0); idleBuild();
    MisKit.hold(P); P.stuckT = 0; P.wrongT = 0;
  }
  function leave(P, spot) {
    const sk = S.skis[S.ride]; if (!sk) return;
    sk.B.go(false); sk.B.v = 0; sk.mesh.rotation.x = 0; sk.mesh.remove(S.wk); S.wk.visible = false;
    S.ride = -1; MisKit.hold(P, false); idleBuild();
    if (spot) { place(P, spot.x, spot.z, spot.h); S.lands++; } else if (S.car) place(P, S.car.x, S.car.z, S.car.h);
    S.car = null; S.dry = null;
  }
  // the car put down at a place: on the ground there, still, its place on the circuit found again (from anywhere: no hint)
  function place(P, x, z, h) {
    P.place(x, z, h); const y = H3.ground(x, z); P.y = P.py = P.roadY = y; P.vx = P.vz = 0; P.w = 0; if (P.vy != null) P.vy = 0; if (P.air) P.air = 0;
    P.locked = false; P.stuckT = 0; P.wrongT = 0; if (trk.query && P.q) { P.q = trk.query(x, z, -1, P.q); P.sPrev = P.q.s; }
  }
  // the direction to the nearest land within R m of a point (16 directions a metre at a time), or null
  function landNear(x, z, R) {
    for (let r = 1; r <= R + 0.01; r += 1) { let sx = 0, sz = 0, n = 0; for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, c = Math.cos(a), s = Math.sin(a); if (depth(x + c * r, z + s * r) <= 0.01) { sx += c; sz += s; n++; } }
      if (n) return { a: Math.atan2(sz, sx), r }; }
    return null;
  }
  // the car's place on the shore by the jet ski: along a towards the land, K.AWAY m past the water's edge (still dry there), facing the land
  function carSpot(x, z, a) {
    const c = Math.cos(a), s = Math.sin(a);
    for (let r = 0.5; r < 14; r += 0.5) { if (depth(x + c * r, z + s * r) > 0.01) continue;
      for (let e = K.AWAY; e >= 1; e -= 1) { const px = x + c * (r + e), pz = z + s * (r + e); if (depth(px, pz) <= 0.01 && inMap(px, pz)) return { x: px, z: pz, h: a }; } return null; }
    return null;
  }

  // ---- a step (before the cars move): the jet ski ridden, the car held; or the car in the water; the card's zone. Returns an event or null
  function step(dt, P, inp) {
    if (!S || !P) return null; const pick = S.pick; S.pick = null; let ev = null;
    if (S.ride >= 0) {
      const sk = S.skis[S.ride], B = sk.B, I = inp ? [inp.steer || 0, inp.thr || 0, inp.brk || 0] : [0, 0, 0];
      MisKit.hold(P); P.stuckT = 0; P.wrongT = 0;
      ride(dt, sk, I);
      const sp = Math.abs(B.v), L = sp < K.VLAND ? landNear(B.x, B.z, K.LAND) : null; S.zone = L ? 'land' : null;
      if (pick === 'car' && L) { const spot = carSpot(B.x, B.z, L.a); leave(P, spot); }
    } else {
      ev = carWater(dt, P);
      const sp = Math.hypot(P.vx || 0, P.vz || 0); let k = -1, kd = K.TAKE;
      if (sp < K.VTAKE && depth(P.x, P.z) < 0.3 && !busy()) S.skis.forEach((sk, i) => { const d = Math.hypot(sk.B.x - P.x, sk.B.z - P.z); if (d < kd) { kd = d; k = i; } });
      S.near = k; S.zone = k >= 0 ? 'take' : null;
      if (pick === 'ski' && k >= 0) take(P, k);
    }
    return ev;
  }
  function post(P) { if (S && S.ride >= 0 && P) { P.stuckT = 0; P.wrongT = 0; } }
  // the jet ski ridden: the kit's step (its speed, heading, the wave under it and its pitch, the camera), then its slide, the waves' bump, its lean
  function ride(dt, sk, I) {
    const B = sk.B, x0 = B.x, z0 = B.z;
    seaK += ((seaAt(B.x, B.z) ? 1 : 0) - seaK) * (1 - Math.exp(-dt * 0.5));
    B.step(dt, I[0], I[1], I[2]);
    const sp = Math.abs(B.v), g = K.GRIP * (1 + 2 * (1 - clamp(sp / K.VMAX, 0, 1)));
    S.mh += wrap(B.h - S.mh) * (1 - Math.exp(-dt * g));
    if (!B.stuck) { const nx = x0 + Math.cos(S.mh) * B.v * dt, nz = z0 + Math.sin(S.mh) * B.v * dt; if (wet(nx, nz)) { B.x = nx; B.z = nz; } else { B.x = x0; B.z = z0; B.v *= 0.3; B.stuck = true; } }
    else S.mh = B.h;
    B.v *= Math.exp(-dt * Math.abs(Math.sin(wrap(B.h - S.mh))) * K.SLIDE);
    { const fx = Math.cos(B.h) * 2, fz = Math.sin(B.h) * 2, c = (wave(B.x + fx, B.z + fz, B.t) - wave(B.x - fx, B.z - fz, B.t)) / 4; if (c > 0 && B.v > 0) B.v *= Math.exp(-dt * c * K.BUMP); }
    S.roll += (I[0] * K.LEAN * clamp(sp / 8, 0, 1) - S.roll) * (1 - Math.exp(-dt * 5));
    sk.mesh.position.set(B.x, B.y, B.z); sk.mesh.rotation.x = S.roll;
    S.wk.visible = sp > 1.5; S.wk.rotation.y = wrap(B.h - S.mh); if (S.wk.visible) S.wk.scale.set(clamp(sp / K.VMAX, 0.25, 1), 1, clamp(sp / K.VMAX, 0.4, 1));
  }
  // the car in the water: the shallow slows it, the deep puts it back on the shore where it left it (facing the land)
  function carWater(dt, P) {
    const d = depth(P.x, P.z);
    if (d <= 0.02) { if (!P.air && P.y > WL - 0.05 && !busy()) S.dry = { x: P.x, z: P.z, h: P.h }; S.sink = 0; return null; }
    const wetC = WL - P.y; if (wetC > 0) MisKit.wade(P, wetC, dt, { drag: K.WADE, slip: 0.4, deep: K.DEEP });
    if (d > K.DEEP && wetC > K.DEEP - 0.15) { S.sink += dt; if (S.sink >= K.SINK) return back(P); } else S.sink = 0;
    return null;
  }
  function back(P) {
    const D = S.dry; S.sink = 0; S.backs++;
    if (!D) { const L = landNear(P.x, P.z, 40), sp = L && carSpot(P.x, P.z, L.a); if (sp) place(P, sp.x, sp.z, sp.h); return 'NAZAJ NA OBALO'; }
    let a = Math.atan2(D.z - P.z, D.x - P.x); if (Math.hypot(D.z - P.z, D.x - P.x) < 0.5) a = D.h + Math.PI;
    const x = D.x + Math.cos(a) * K.AWAY, z = D.z + Math.sin(a) * K.AWAY, ok = depth(x, z) <= 0.01 && inMap(x, z);
    place(P, ok ? x : D.x, ok ? z : D.z, a);
    return 'NAZAJ NA OBALO';
  }
  // the car busy elsewhere: in the helicopter, a gondola's cabin, on the train, the fire engine (js/nvheli.js, js/nvride.js)
  const busy = () => (typeof NVHeli !== 'undefined' && NVHeli.on && NVHeli.on()) || (typeof NVRide !== 'undefined' && NVRide.on && NVRide.on());

  // ---- drawn between the steps: the card at the top (the fire engine's look, js/nvride.js); the idle jet skis far off hidden
  function frame(dt, alpha, P, live) {
    if (!S) return; const C = Render.camera;
    const b = S.idle.geometry.boundingSphere; if (C && b) S.idle.visible = S.idleN > 0 && Math.hypot(b.center.x - C.position.x, b.center.z - C.position.z) < b.radius + K.SHOW;
    card(!!live);
  }
  function card(live) {
    const want = live && S.zone ? S.zone : null;
    if (!want) { if (el) el.style.display = 'none'; return; }
    if (!el) { if (!document.getElementById('nvw-css')) { const src = document.getElementById('nvm-css'), st = document.createElement('style'); st.id = 'nvw-css'; st.textContent = src ? src.textContent.split('#nvm').join('#nvw') : ''; document.head.appendChild(st); }
      el = document.createElement('div'); el.id = 'nvw'; el.style.setProperty('--c', '#23c8ff'); el.style.setProperty('--ck', '#06142a'); ((document.getElementById('hud') || document.body).parentElement || document.body).appendChild(el);
      el.addEventListener('pointerdown', (e) => { e.stopPropagation(); const b = e.target.closest('[data-a]'); if (b && S) S.pick = b.dataset.a; }); }
    if (el.dataset.mode !== want) { el.dataset.mode = want; const row = (a, n, sub) => `<button class="row" data-a="${a}" style="--t:#23c8ff;--k:#06142a;--bt:rgba(6,20,42,.28)">${n}<small>${sub}</small></button>`;
      el.innerHTML = `<div class="hd"><b>Jet ski</b><i>the course · the canal · the sea</i></div>` + (want === 'take' ? row('ski', 'TAKE THE JET SKI', 'your car waits here on the shore') : row('car', 'BACK TO YOUR CAR', 'on the shore here · the jet ski stays')) + `<div class="ft">${want === 'take' ? 'shown while you stand here' : 'shown by the shore'}</div>`; }
    if (el.style.display !== '') el.style.display = '';
  }

  // ---- the hooks: the car's ground under the water (its bed), the jet skis built (before the merging)
  function init(h3, track) {
    if (h3 !== H3) SG = null;
    H3 = h3; trk = track; if (!H3 || !trk || typeof MisKit === 'undefined' || !MisKit.boat) return false;
    WL = H3.water && H3.water.WL != null ? H3.water.WL : -0.12;
    if (!trk.nvWater && trk.ground2) { g0 = trk.ground2; trk.nvWater = true;
      trk.ground2 = (x, z, y) => { const g = g0(x, z, y); if (g > WL + 0.8) return g; const d = depth(x, z); return d > 0.01 ? Math.min(g, WL - d) : g; }; }
    if (!S) { S = build(); if (S) idleBuild(); }
    return !!S;
  }
  // a restart at HOME: off the jet ski, the jet skis back in their places
  function reset(P) {
    if (!S) return; if (S.ride >= 0) leave(P, null);
    for (const sk of S.skis) sk.B.place(sk.home.x, sk.home.z, sk.home.h);
    idleBuild(); S.zone = null; S.pick = null; S.dry = null; S.sink = 0; S.near = -1;
  }
  const on = () => !!(S && S.ride >= 0);
  function state() {
    if (!S) return null; const r = S.ride >= 0 ? S.skis[S.ride].B : null;
    return { skis: S.skis.map(s => ({ at: s.at, x: +s.B.x.toFixed(2), z: +s.B.z.toFixed(2), h: +s.B.h.toFixed(3), y: +s.B.y.toFixed(3), home: s.home })),
      idle: { n: S.idleN, dyn: !!S.idle.userData.dyn, inScene: !!S.idle.parent, shown: S.idle.visible }, ride: S.ride, zone: S.zone, near: S.near, car: S.car, dry: S.dry, backs: S.backs, rides: S.rides, lands: S.lands,
      ski: r ? { x: r.x, z: r.z, h: r.h, v: r.v, y: r.y, mh: S.mh, roll: S.roll, stuck: r.stuck, sea: seaK } : null };
  }
  // (the tests: the jet ski ridden put at a place, still)
  function put(x, z, h) { if (!S || S.ride < 0) return; const B = S.skis[S.ride].B; B.place(x, z, h); S.mh = h; S.roll = 0; seaK = seaAt(x, z) ? 1 : 0; }
  return { init, reset, step, post, frame, on, state, depth, put, pick: (a) => { if (S) S.pick = a; }, K };
})();
if (typeof module !== 'undefined') module.exports = NVWater;
