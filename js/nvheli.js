// NEW VERSION · TEST 1: the rescue helicopter flies (as the user chose it in the pictures, heli8: version 2, one big rotor and a tail, red with
// a white cross). Parked on the rescue base's H (js/nvbase.js builds it) with its back ramp down: the car drives up it into the bay, the
// helicopter goes see-through, its nose doors swing aside and the front ramp goes down, and a menu of three opens at the top (the garages'
// style, js/nvmenu.js): WATER RESCUE and FIREFIGHTING locked for now (made with the missions), FREE FLIGHT. No choice: drive on, out over the
// front ramp. FREE FLIGHT: in 1 s the doors and the ramps shut, the helicopter solid again (the car no longer seen), the rotor starts and it
// rises at once to its height; the gas flies it on and up, the brake slows it and takes it down (the user, 30. 10.: no button), the
// steering turns it; down to the ground with the brake it lands (anywhere but on the water, a roof or in the trees); top left the height
// over the ground and the speed. Landed, the rotor stops and the ramps open: the menu again (FREE FLIGHT: up again), or the gas drives the
// car out (the gas lifts it only once FREE FLIGHT is chosen again), and the helicopter flies home to
// its H by itself once the car is away (it always stands on the H when nobody flies it). The car rides in it (the bay's floor and ramps are
// its ground, js/core.js track.ground2; the shell its walls, track.wall2); its parts merged for the phones (a handful of draw calls).
// Loaded with the new map (js/game.js nvStart).
const NVHeli = (function () {
  'use strict';
  const tr = (s) => (typeof Lang !== 'undefined' && Lang.tr ? Lang.tr(s) : s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), sst = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
  const lerp = (a, b, t) => a + (b - a) * t;
  // the flight: the height over the ground it rises to (and over the H's level), the most over the ground, the top speed (m/s), its turn (rad/s),
  // the rotor's speed (rad/s) and how fast it spins up and down, the climb and the descent (m/s)
  const F = { agl: 24, home: 32, top: 70, vMax: 42, acc: 7, brk: 9, drag: 0.5, yaw: 1.05, rot: 32, spinUp: 26, spinDn: 9, up: 6, down: 6, board: 1 };
  let H3 = null, trk = null, hc = null, G = null, S = null, ui = null, mats = null, dust = null;
  let g0 = null, w0 = null;   // (the map's own ground and walls, under the helicopter's)

  // ---- the model: js/nvbase.js helicopter(), its parts merged by what moves (the shell, the rotor, the tail rotor, the ramps, the doors) ----
  // (the meshes' and the root's matrixWorld as the model was built: build() updates them once, before any part is taken off its parent)
  function merge(meshes, root, mat, vc) {
    const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), P = [], N = [], U = [], C = []; let uv = true;
    for (const m of meshes) { const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld));
      const p = g.attributes.position.array, n = g.attributes.normal.array, u = g.attributes.uv, c = m.material.color; for (let i = 0; i < p.length; i++) { P.push(p[i]); N.push(n[i]); }
      if (!u) uv = false; else for (let i = 0; i < u.array.length; i++) U.push(u.array[i]); if (vc) for (let i = 0; i < p.length / 3; i++) C.push(c.r, c.g, c.b); g.dispose(); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    if (uv && !vc) g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); if (vc) g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
    g.computeBoundingSphere(); const o = new THREE.Mesh(g, mat); o.castShadow = true; o.receiveShadow = true; o.userData.dyn = true; return o;
  }
  function build(h) {
    h.G.updateMatrixWorld(true); const RO = h.RO, TR = h.TR, inner = new Set(h.inner), lin = new Set(h.lin);
    const VC = new THREE.MeshLambertMaterial({ vertexColors: true }), LIN = VC.clone();
    mats = { VC, LIN, o0: new Map([[VC, 0.42], [LIN, 0.12]]) };
    const sub = (grp) => { const ms = []; grp.traverse(o => { if (o.isMesh) ms.push(o); }); grp.clear(); const m = merge(ms, grp, VC, true); grp.add(m); return m; };
    // the rotors' blur: a disc with the blades' sweep and the painted tips' ring, the blades hidden while it spins fast (the pictures' heli8)
    const blurTex = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 256; const c = cv.getContext('2d'), g = c.createRadialGradient(128, 128, 10, 128, 128, 128);
      g.addColorStop(0, 'rgba(30,30,32,0.05)'); g.addColorStop(0.55, 'rgba(30,30,32,0.16)'); g.addColorStop(0.86, 'rgba(30,30,32,0.26)'); g.addColorStop(0.9, 'rgba(242,193,46,0.55)'); g.addColorStop(0.97, 'rgba(242,193,46,0.45)'); g.addColorStop(1, 'rgba(242,193,46,0)'); c.fillStyle = g; c.fillRect(0, 0, 256, 256);
      c.strokeStyle = 'rgba(25,25,28,0.18)'; c.lineWidth = 7; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(128, 128, 110, k * 2.09, k * 2.09 + 0.7); c.stroke(); } return new THREE.CanvasTexture(cv); })();
    const disc = (grp, r) => { const d = new THREE.Mesh(new THREE.CircleGeometry(r, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: blurTex, transparent: true, depthWrite: false, side: THREE.DoubleSide })); d.renderOrder = 5; d.visible = false; d.userData.dyn = true; grp.add(d); return d; };
    let R = 0; RO.traverse(o => { if (o.isMesh) { o.geometry.computeBoundingBox(); R = Math.max(R, o.geometry.boundingBox.max.x + o.position.x); } });
    const parts = { RO: sub(RO), TR: sub(TR), RR: sub(h.RR), RF: sub(h.RF), DR: h.DR.map(sub) };
    parts.roD = disc(RO, Math.max(R, 10.5)); parts.roD.position.y = -0.07; parts.trD = disc(TR, 2.3);
    // the body: the shell (see-through while the car drives in), the bay's lining (only then: shut in the shell, it is not seen), the floor (always
    // solid); the sides' small REŠEVANJE not (not read from behind the car: the band dark there)
    const shell = [], ln = [], fl = []; for (const o of [...h.G.children]) { if (!o.isMesh) continue; h.G.remove(o); if (o.material.map) continue; (inner.has(o) ? (lin.has(o) ? ln : fl) : shell).push(o); }
    parts.shell = merge(shell, h.G, VC, true); h.G.add(parts.shell); parts.lin = merge(ln, h.G, LIN, true); parts.lin.castShadow = false; parts.lin.visible = false; h.G.add(parts.lin);
    parts.floor = merge(fl, h.G, fl[0].material, false); parts.floor.castShadow = false; h.G.add(parts.floor);
    // (the small parts cast no shadow: the doors, the front ramp, the tail rotor)
    for (const m of [parts.TR, parts.RF, ...parts.DR]) m.castShadow = false;
    h.G.rotation.order = 'YXZ'; h.G.userData.dyn = true; return parts;
  }
  // the dust the rotor blows up off the ground while it is low
  function dustDisc() {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d'), g = c.createRadialGradient(64, 64, 8, 64, 64, 64);
    g.addColorStop(0, 'rgba(196,178,146,0)'); g.addColorStop(0.45, 'rgba(196,178,146,0.42)'); g.addColorStop(0.75, 'rgba(206,190,160,0.3)'); g.addColorStop(1, 'rgba(206,190,160,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128);
    const m = new THREE.Mesh(new THREE.CircleGeometry(16, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false, opacity: 0, polygonOffset: true, polygonOffsetFactor: -14, polygonOffsetUnits: -14 }));
    m.renderOrder = 4; m.visible = false; m.userData.dyn = true; return m;
  }

  // ---- where things are: the helicopter's own frame (u along its nose, v to its side) ----
  const loc = (x, z) => { const c = Math.cos(S.psi), s = Math.sin(S.psi), dx = x - S.x, dz = z - S.z; return [dx * c + dz * s, -dx * s + dz * c]; };
  const wld = (u, v) => { const c = Math.cos(S.psi), s = Math.sin(S.psi); return [S.x + u * c - v * s, S.z + u * s + v * c]; };
  const V = () => hc.v, YF = 1.25;   // (the bay's floor over the helicopter's foot)
  const RL = () => hc.RR.userData.Lr * Math.cos(hc.RR.userData.A);   // (a ramp's reach along the ground)
  // the height the bay's floor and its open ramps give at (x, z) (null: not on them); while it flies only with the car in it
  function deck(x, z, y) {
    if (!S || (S.alt > 0.3 && !S.carry)) return null;
    if (y != null && y < S.y - 0.6) return null;
    const [u, v] = loc(x, z), w = V(), r = RL(); if (Math.abs(v) > w.bayW / 2 + 0.25) return null;
    if (u >= w.x0 && u <= w.x1) return S.y + YF;
    if (S.fR > 0.98 && u < w.x0 && u > w.x0 - r) return S.y + YF * (u - (w.x0 - r)) / r;
    if (S.fF > 0.98 && u > w.x1 && u < w.x1 + r) return S.y + YF * (w.x1 + r - u) / r;
    return null;
  }
  // the walls: the shell round the bay (the car inside kept in it, one outside kept out), the shut nose and ramps
  function wall(x, z, y, out) {
    if (!S || S.carry || y < S.y - 0.8 || y > S.y + 4.2) return false;
    const [u, v] = loc(x, z), w = V(), hw = 2.7, xN = w.x1 + 1.9, bw = w.bayW / 2, av = Math.abs(v);
    if (u < w.x0 || u > xN || av > hw) return false;
    const inCh = av < bw && (u <= w.x1 || S.fF > 0.98);
    if (inCh) return false;
    const c = Math.cos(S.psi), s = Math.sin(S.psi), sv = v < 0 ? -1 : 1; let d, nx, nz;
    if (S.cin) { if (av >= bw) { d = av - bw; nx = s * sv; nz = -c * sv; } else { d = u - w.x1; nx = -c; nz = -s; } }   // (inside: back into the bay)
    else { const dS = hw - av, dB = u - w.x0, dN = xN - u; d = Math.min(dS, dB, dN);
      if (d === dS) { nx = -s * sv; nz = c * sv; } else if (d === dB) { nx = -c; nz = -s; } else { nx = c; nz = s; } }
    out[0] = nx; out[1] = nz; out[2] = d; return true;
  }

  // ---- the state ----
  function fresh() {
    const h = hc.home;
    return { mode: 'park', x: h.x, z: h.z, y: h.y, psi: h.psi, pitch: 0, roll: 0, alt: 0, vf: 0, vy: 0, yawR: 0, w: 0, ang: 0, tAng: 0,
      fR: 1, fF: 0, dr: 0, xr: 0, carry: false, cin: false, onF: false, wasF: false, t: 0, want: 'up', pick: null, wet: false, wetN: 0, away: 0, auto: null, from: null,
      prev: null, accF: 0, gAt: h.y, menu: false, cr: 0, crT: 0, blk: null, blkT: 0, wetU: false };
  }
  const groundAt = (x, z) => { const g = H3.ground(x, z); return Number.isFinite(g) ? g : 0; };
  const WL = () => (H3.water && H3.water.WL != null ? H3.water.WL : -0.12);
  // (the sea, past its beach: js/newmap.js waterSide; the course for jet skis and its canal: js/nvboat.js)
  const seaAt = (x, z) => { const W = H3.water, C = H3.waterCourse; return !!(W && W.region && W.bedAt && W.region(x, z) && W.bedAt(x, z).y < WL() - 0.02) || !!(C && C.dW && C.dW(x, z) < -0.3); };
  // the top of what stands at (x, z) (a roof, a tree, a wall: what casts a shadow, the map's merged cells, js/nvbake.js, and the trees
  // drawn as instances; not the helicopter nor the car) or the ground: one ray down, kept per cell of the grid (the map does not change)
  const topC = new Map(); let stand = null, ray = null, carRef = null;
  function topAt(x, z, grid = 1) {
    const X = Math.round(x / grid) * grid, Z = Math.round(z / grid) * grid, k = X + ',' + Z; let v = topC.get(k); if (v !== undefined) return v;
    if (!stand && typeof Render !== 'undefined' && Render.scene) { const v = carRef && Render.viewOf ? Render.viewOf(carRef) : null, skip = new Set([G, dust, v && v.grp].filter(Boolean)), L = [];
      const walk = (o) => { if (skip.has(o)) return; if (o.isMesh && o.castShadow && o.geometry) L.push(o); for (const c of o.children) walk(c); }; walk(Render.scene); stand = L; }
    v = groundAt(X, Z); if (stand && stand.length) { if (!ray) { ray = new THREE.Raycaster(); ray.far = 600; } ray.set(new THREE.Vector3(X, 400, Z), new THREE.Vector3(0, -1, 0)); const h = ray.intersectObjects(stand, false); if (h.length) v = Math.max(v, h[0].point.y); }
    topC.set(k, v); return v;
  }
  // the ground under the helicopter's foot (its highest under the skids and the middle), whether it is the sea, and (check) whether something
  // stands there (no landing on a roof or in a tree: it stays 3 m over it)
  const FOOT = [[0, 0], [-4.4, 2.5], [-4.4, -2.5], [3.8, 2.5], [3.8, -2.5], [-7.5, 0], [8, 0]];
  function under(check) {
    let g = -1e9, top = -1e9, wet = check ? false : S.wetU; for (const [u, v] of FOOT) { const [x, z] = wld(u, v); g = Math.max(g, groundAt(x, z)); if (check) { top = Math.max(top, topAt(x, z)); wet = wet || seaAt(x, z); } }
    if (check) S.wetU = wet; return { g: Math.max(g, WL()), wet, top, block: check && !wet && top > g + 0.5 };   // (wet: a part of it over the sea)
  }
  // the height it flies at: over the ground and what stands on it ahead (looked at every 0.25 s), never lower than over the H
  function cruise() {
    if (S.crT > 0) return S.cr;
    const c = Math.cos(S.psi), s = Math.sin(S.psi), sg = S.vf < 0 ? -1 : 1; let g = -1e9; for (const d of [0, 20, 45]) { const x = S.x + c * d * sg, z = S.z + s * d * sg; g = Math.max(g, groundAt(x, z) + F.agl, topAt(x, z, 4) + 12); }
    S.crT = 0.25; return (S.cr = Math.max(g, hc.home.y + F.home));
  }
  // the car on its spot in the bay (in the middle, facing the nose)
  function seat(P, k) {
    const [x, z] = wld((V().x0 + V().x1) / 2 - 0.3, 0);
    if (k >= 1) { P.x = x; P.z = z; P.h = S.psi; } else { const f = S.from; P.x = lerp(f.x, x, k); P.z = lerp(f.z, z, k); P.h = f.h + wrap(S.psi - f.h) * k; }
    P.vx = P.vz = 0; P.w = 0; if (P.nvA) P.nvA = 0;
  }

  // ---- each step of the race (js/game.js stepRace), before the cars move: the helicopter flies, the car rides in it ----
  function step(dt, P, inp) {
    if (!S || !P) return; carRef = P;
    const w = V(), [cu, cv] = loc(P.x, P.z), r = RL(), up = (P.y || 0) > S.y + 0.15;
    S.cin = up && Math.abs(cv) < w.bayW / 2 + 0.2 && cu > w.x0 - r && cu < w.x1 + r;   // (on the ramps or in the bay)
    S.onF = (P.y || 0) > S.y + 0.9 && Math.abs(cv) < w.bayW / 2 && cu > w.x0 + 0.4 && cu < w.x1 - 0.4;   // (on the bay's floor)
    S.prev = { x: S.x, z: S.z, y: S.y, psi: S.psi, pitch: S.pitch, roll: S.roll, cx: P.x, cz: P.z, ch: P.h };
    const pick = S.pick; S.pick = null;
    const towards = (k, to, rate) => { S[k] += clamp(to - S[k], -rate * dt, rate * dt); };
    let spinTo = 0, ramps = null, xr = null, fly = false;
    if (S.mode === 'park') {
      ramps = [1, 0, 0]; xr = S.cin ? 1 : 0;
      if (S.onF && !S.wasF) { S.mode = 'open'; S.menu = true; }
      const home = Math.hypot(S.x - hc.home.x, S.z - hc.home.z) > 2 || Math.abs(wrap(S.psi - hc.home.psi)) > 0.05, far = Math.hypot(P.x - S.x, P.z - S.z) > 40;
      S.away = home && far && !S.cin ? S.away + dt : 0; if (S.away > 3) { S.mode = 'auto'; S.auto = 'spin'; S.t = 0; S.away = 0; }
    } else if (S.mode === 'open') {   // the car in the bay: the nose open, the menu while it stands on the floor; no choice: out over the front ramp
      ramps = [1, 1, 1]; xr = 1; S.menu = S.onF;
      if (pick === 'free' && S.onF) { S.mode = 'board'; S.t = 0; S.from = { x: P.x, z: P.z, h: P.h }; S.menu = false; S.want = 'up'; }
      else if (!S.cin && !S.onF) { S.mode = 'park'; S.menu = false; }
    } else if (S.mode === 'board') {   // in 1 s: the doors and the ramps shut, solid again, the rotor starts; then up
      S.t += dt; const k = clamp(S.t / F.board, 0, 1); S.carry = true; seat(P, sst(k));
      ramps = [0, 0, 0]; ramps.rate = 1.6; xr = 0; spinTo = k >= 0.5 ? F.rot : 0;
      if (k >= 1) { S.mode = 'air'; S.xr = 0; S.fR = S.fF = S.dr = 0; }
    } else if (S.mode === 'air') {
      S.carry = true; fly = true; spinTo = F.rot; ramps = [0, 0, 0]; xr = 0;
    } else if (S.mode === 'land') {   // down: the rotor stops, then the ramps open: the menu again (FREE FLIGHT: up again), or the car drives out
      spinTo = 0; S.vf = 0; S.yawR = 0;
      const open = S.w < F.rot * 0.35; ramps = open ? [1, 1, 1] : [0, 0, 0]; xr = open ? 1 : 0;
      S.carry = !(S.fR > 0.98 && S.fF > 0.98);
      if (S.carry) seat(P, 1);
      if (!S.carry) { S.mode = S.onF ? 'open' : 'park'; S.menu = S.onF; }
    } else if (S.mode === 'auto') {   // nobody in it, away from the H: home by itself
      fly = true; ramps = [0, 0, 0]; xr = 0; spinTo = F.rot;
    }
    S.wasF = S.onF; if (S.carry || S.cin) P.stuckT = 0;   // (standing in it is not stuck: no Na progo as it drives out)
    // the ramps (rear, front, the nose's doors) and the see-through
    if (ramps) { const rt = ramps.rate || 1.4;   // (the front ramp goes down only between the doors swung aside, the doors shut only over the ramp gone up)
      towards('fR', ramps[0], rt); towards('fF', ramps[1] > S.fF && S.dr < 0.7 ? S.fF : ramps[1], rt); towards('dr', ramps[2] < S.dr && S.fF > 0.3 ? S.dr : ramps[2], rt * 1.4); }
    if (xr != null) towards('xr', xr, S.mode === 'board' ? 1 / F.board : 3);
    S.w += clamp(spinTo - S.w, -F.spinDn * dt, F.spinUp * dt); S.ang += S.w * dt; S.tAng += S.w * 4.3 * dt;
    if (fly) flyStep(dt, P, inp);
    if (S.carry) { seat(P, S.mode === 'board' ? sst(clamp(S.t / F.board, 0, 1)) : 1); P.inThr = 0; P.inBrk = 0; P.inSteer = 0; P.steer = 0; P.inHand = 0; }   // (no brake: held at a stop it would go into reverse)
  }
  // the flight: the player's gas, brake and steering (or the way home), its height up or down
  function flyStep(dt, P, inp) {
    const sp = S.w / F.rot, auto = S.mode === 'auto';
    let thr = 0, brk = 0, steer = 0, want = S.want;
    if (auto) { const h = hc.home, dx = h.x - S.x, dz = h.z - S.z, d = Math.hypot(dx, dz);
      if (S.auto === 'spin') { want = 'hold'; if (S.w > F.rot * 0.9) S.auto = 'up'; }
      else if (S.auto === 'up') { want = 'up'; if (S.y > cruise() - 4 || d < 8) S.auto = 'go'; }
      if (S.auto === 'go') { want = d < 6 ? 'hold' : 'up'; const a = wrap(Math.atan2(dz, dx) - S.psi); steer = clamp(a * 2, -1, 1) * (d > 6 ? 1 : 0); const vt = d > 6 ? Math.min(26, d * 0.6) * Math.max(0, Math.cos(a)) : 0; thr = S.vf < vt ? 1 : 0; brk = S.vf > vt + 1 ? 1 : 0;
        if (d < 6 && Math.abs(S.vf) < 1.5) S.auto = 'turn'; S.x += clamp(dx, -2 * dt, 2 * dt) * (d < 6 ? 1 : 0); S.z += clamp(dz, -2 * dt, 2 * dt) * (d < 6 ? 1 : 0); }
      if (S.auto === 'turn') { want = 'hold'; const a = wrap(h.psi - S.psi); steer = clamp(a * 2, -1, 1); brk = 1; S.x += clamp(dx, -2 * dt, 2 * dt); S.z += clamp(dz, -2 * dt, 2 * dt); if (Math.abs(a) < 0.01) { S.psi = h.psi; S.auto = 'down'; } }
      if (S.auto === 'down') { want = 'down'; brk = 1; S.x += clamp(dx, -2 * dt, 2 * dt); S.z += clamp(dz, -2 * dt, 2 * dt); } }
    else if (inp) { thr = clamp(inp.thr || 0, 0, 1); brk = clamp(inp.brk || 0, 0, 1); steer = clamp(inp.steer || 0, -1, 1);
      want = S.want === 'up' && S.y < cruise() - 1 && !brk ? 'up' : brk > 0.05 ? 'down' : thr > 0.05 ? 'rise' : 'hold'; if (want !== 'up') S.want = want; }   // (after FREE FLIGHT up to its height by itself; then the gas up, the brake down)
    S.crT -= dt; S.blkT -= dt;
    const U = under(want === 'down' && S.y - S.gAt < 40 && S.blkT <= 0); if (U.top > -1e8) { S.blk = U.block ? U.top : null; S.blkT = 0.2; } S.gAt = U.g; S.alt = Math.max(0, S.y - U.g); const low = S.alt < 1.5;
    // turning and the speed along its nose (low over the ground only slowly)
    S.yawR += clamp(steer * F.yaw * sp - S.yawR, -3 * dt, 3 * dt); S.psi = wrap(S.psi + S.yawR * dt);
    const v0 = S.vf; let a = thr * F.acc - (S.vf > 0 ? brk * F.brk : 0) - S.vf * F.drag * (thr || brk ? 0.15 : 1) * (low ? 3 : 1);
    if (!(sp > 0.6)) a = -S.vf * 2; S.vf = clamp(S.vf + a * dt, 0, F.vMax); if (low && Math.abs(S.vf) > 3) S.vf -= Math.sign(S.vf) * Math.min(Math.abs(S.vf) - 3, 10 * dt);
    S.accF += ((S.vf - v0) / dt - S.accF) * Math.min(1, dt * 4);
    S.x += Math.cos(S.psi) * S.vf * dt; S.z += Math.sin(S.psi) * S.vf * dt;
    if (trk && trk.free) { const B = trk.free; S.x = clamp(S.x, B[0] + 6, B[1] - 6); S.z = clamp(S.z, B[2] + 6, B[3] - 6); }
    // up and down: up to its height (the rotor at speed first), down onto the ground below (on the sea it stays over the water)
    let vt = 0;
    if (want === 'up') vt = clamp((cruise() - S.y) * 0.8, -F.down, F.up) * clamp((sp - 0.5) * 2, 0, 1);
    else if (want === 'rise') vt = thr * F.up * clamp((F.top - S.alt) / 5, 0, 1) * clamp((sp - 0.5) * 2, 0, 1);
    else if (want === 'down') { const no = U.wet || S.blk != null, fl = U.wet ? U.g + 4 : S.blk != null ? S.blk + 3 : U.g; vt = -clamp((S.y - fl) * 0.8, 0.7, F.down) * (auto ? 1 : Math.max(0.3, brk));
      if (no && S.y - fl < 0.6) { vt = clamp((fl - S.y) * 2, -F.down, F.up); if (!S.wet) { S.wet = S.wetK = U.wet ? 'wet' : 'top'; S.wetN++; } } else if (!no) S.wet = false; }
    else vt = clamp((Math.max(U.g + 2, S.y) - S.y) * 2, 0, F.up) * clamp((sp - 0.5) * 2, 0, 1);
    if (want !== 'down') { S.wet = false; S.blk = null; S.wetU = false; }
    const va = auto ? 6 : 10; S.vy += clamp(vt - S.vy, -va * dt, va * dt); S.y += S.vy * dt;   // (the player's gas and brake answered quicker)
    if (S.y < U.g) { S.y = U.g; S.vy = Math.max(0, S.vy); }
    S.alt = Math.max(0, S.y - U.g);
    if (want === 'down' && !U.wet && S.blk == null && S.y - U.g < 0.03) {   // touch down
      S.y = U.g; S.vy = 0; S.alt = 0; S.vf = 0; S.yawR = 0;
      if (auto) { S.mode = 'park'; S.auto = null; S.x = hc.home.x; S.z = hc.home.z; S.psi = hc.home.psi; S.y = hc.home.y; } else { S.mode = 'land'; S.want = 'down'; } }
    // its lean: the nose down as it speeds up and with the speed, the side into the turn
    const pt = clamp(-S.accF / F.acc * 0.11 - S.vf / F.vMax * 0.07, -0.2, 0.12), rl = clamp(-S.yawR * clamp(Math.abs(S.vf) / 20, 0, 1) * 0.28, -0.3, 0.3);
    S.pitch += (pt * (S.alt > 0.3 ? 1 : 0) - S.pitch) * Math.min(1, dt * 3); S.roll += (rl * (S.alt > 0.3 ? 1 : 0) - S.roll) * Math.min(1, dt * 3);
  }
  // after the cars moved: the car kept where it rides, drawn moving smoothly (its last place for the frames between the steps)
  function post(P) {
    if (!S || !S.carry || !S.prev || !P) return;
    P.px = S.prev.cx; P.pz = S.prev.cz; P.ph = S.prev.ch;
  }

  // ---- every frame: the model where the state says (between the steps), the rotor, the screen ----
  function frame(dt, alpha, P, live) {
    if (!S || !G) return;
    const p = S.prev || S, k = clamp(alpha == null ? 1 : alpha, 0, 1), psi = p.psi + wrap(S.psi - p.psi) * k;
    G.position.set(lerp(p.x, S.x, k), lerp(p.y, S.y, k), lerp(p.z, S.z, k)); G.rotation.set(lerp(p.roll, S.roll, k), -psi, lerp(p.pitch, S.pitch, k));
    const RR = hc.RR, RF = hc.RF, A = RR.userData.A;
    RR.rotation.z = -Math.PI / 2 + (A + Math.PI / 2) * sst(S.fR); RF.rotation.z = Math.PI / 2 + (-A - Math.PI / 2) * sst(S.fF);
    for (const d of hc.DR) d.rotation.y = -d.userData.s * 1.75 * sst(S.dr);
    const fast = S.w > 12; hc.RO.rotation.y = -S.ang; hc.TR.rotation.y = S.tAng; hc.parts.roD.visible = hc.parts.trD.visible = fast; hc.parts.RO.visible = hc.parts.TR.visible = !fast;
    hc.parts.roD.rotation.y = S.ang * 0.13;
    see(S.xr);
    // past the fog not drawn, as the map's merged cells (js/render.js cullByDistance: world.cullFog), its sphere where it is now
    const W = typeof Render !== 'undefined' && Render.world; if (W && W.cullFog && fogP.in !== W.cullFog) { fogP.in = W.cullFog; W.cullFog.push(fogP); } fogP.geometry.boundingSphere.center.copy(G.position);
    // the dust under it while the rotor turns low over the ground
    const dk = (S.w / F.rot) * clamp(1 - S.alt / 14, 0, 1); dust.visible = dk > 0.03; if (dust.visible) { dust.position.set(G.position.x, S.gAt + 0.06, G.position.z); dust.material.opacity = 0.9 * dk; dust.scale.setScalar(0.7 + 0.5 * (1 - clamp(S.alt / 14, 0, 1))); dust.rotation.y += dt * 2; }
    // the car: not seen once the helicopter is solid round it
    const view = typeof Render !== 'undefined' && Render.viewOf ? Render.viewOf(P) : null, hide = S.carry && S.xr < 0.05;
    if (view && view.grp && view.grp.visible === hide) view.grp.visible = !hide;
    screen(live);
  }
  // the shell see-through (1) or solid (0): the floor stays, the bay's lining more see-through than the shell
  let seeAt = -1; const fogP = { in: null, geometry: { boundingSphere: { center: { copy() {}, distanceTo: () => 0 }, radius: 15 } }, get visible() { return !G || G.visible; }, set visible(v) { if (G) G.visible = v; } };
  function see(f) {
    if (Math.abs(f - seeAt) < 1e-4) return; seeAt = f; const s = 1 - sst(f);
    for (const [m, o0] of mats.o0) { m.opacity = o0 + (1 - o0) * s; const tr2 = s < 0.999; if (m.transparent !== tr2) { m.transparent = tr2; m.needsUpdate = true; } m.depthWrite = s > 0.8; }
    const p = hc.parts, cast = s > 0.999; for (const o of [p.shell, p.RO, p.RR]) o.castShadow = cast; p.lin.visible = !cast;
  }

  // ---- the screen: the menu, the button over the pedals, the height and the speed ----
  const LOCK = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" style="vertical-align:-2px"><path d="M7 10V7.5a5 5 0 0 1 10 0V10h1.2c.7 0 1.3.6 1.3 1.3v8.4c0 .7-.6 1.3-1.3 1.3H5.8c-.7 0-1.3-.6-1.3-1.3v-8.4c0-.7.6-1.3 1.3-1.3zm2.4 0h5.2V7.5a2.6 2.6 0 0 0-5.2 0z"/></svg>';
  const ITEMS = [['WATER RESCUE', 'swimmers and boats in trouble at sea', 'lock'], ['FIREFIGHTING', 'sea water onto the forest fire', 'lock'], ['FREE FLIGHT', 'fly anywhere, land anywhere', 'free']];
  function css() {
    if (document.getElementById('nvh-css')) return;
    const src = document.getElementById('nvm-css'), s = document.createElement('style'); s.id = 'nvh-css';
    s.textContent = (src ? src.textContent.split('#nvm').join('#nvh') : '') + `
#nvh .row.lk { opacity: .55; }
#nvh-info { position: fixed; z-index: 6; left: calc(10px + var(--sl, 0px)); top: calc(8px + var(--st, 0px)); display: none; gap: 6px; font: 700 italic 13px/1 var(--f-ui, Roboto, sans-serif); color: #fff; letter-spacing: .04em; pointer-events: none; }
#nvh-info > div { display: flex; align-items: center; gap: 7px; padding: 6px 11px 6px 8px; border-radius: 12px; border: 2px solid rgba(255,255,255,.5); background: rgba(14,18,25,.55); }
#nvh-info small { display: block; font-size: .78em; opacity: .75; letter-spacing: .1em; }
#nvh-info b { display: block; font-size: 1.55em; margin-top: 2px; font-variant-numeric: tabular-nums; font-weight: 700; }
#nvh-info b i { font-size: .6em; margin-left: 3px; opacity: .85; font-style: italic; }
@media (orientation: portrait) { #nvh-info { font-size: 12px; } }
@media (orientation: landscape) { #hud.nv ~ #btn-pause { right: calc(10px + var(--sr)); } #hud.nv #h-map, #hud.nv #h-ttsp, #hud.nv #h-pit, #hud.nv #h-msg, #hud.nv #h-teamradio, #hud.nv #h-prof, #hud.nv #h-react, #hud.nv #h-wreck, #hud.nv ~ #toast.col { right: calc(var(--map-r) + 52px); } }`;
    document.head.appendChild(s);
  }
  function makeUi() {
    css(); const host = (document.getElementById('hud') || document.body).parentElement || document.body;
    const menu = document.createElement('div'); menu.id = 'nvh'; menu.style.display = 'none';
    const col = '#ff4a3d', T = [0.38, 0, 0.32].map((k, i) => i === 0 ? mix(col, '#ffffff', k) : i === 1 ? col : mix(col, '#000000', k));
    menu.style.setProperty('--c', col); menu.style.setProperty('--ck', ink(col));
    menu.innerHTML = `<div class="hd"><b>Rescue helicopter</b><i class="sub"></i></div>` + ITEMS.map((it, i) => { const k = ink(T[i]), bt = k === '#111' ? 'rgba(0,0,0,.22)' : 'rgba(255,255,255,.28)';
      return `<button class="row${it[2] === 'lock' ? ' lk' : ''}" data-a="${it[2]}" style="--t:${T[i]};--k:${k};--bt:${bt}">${esc(it[0])}<small>${esc(it[1])}</small>${it[2] === 'lock' ? `<em>${LOCK}</em>` : ''}</button>`; }).join('') +
      `<div class="ft">no choice: drive on, out over the front ramp</div><div class="wip">${esc(tr('V izdelavi'))}</div>`;
    let wipT = 0; menu.addEventListener('pointerdown', (e) => { const b = e.target.closest('[data-a]'); e.stopPropagation(); if (!b) return;
      if (b.dataset.a === 'free') { if (S) S.pick = 'free'; } else { const w = menu.querySelector('.wip'); w.classList.add('on'); clearTimeout(wipT); wipT = setTimeout(() => w.classList.remove('on'), 1400); } });
    const info = document.createElement('div'); info.id = 'nvh-info';
    info.innerHTML = `<div><svg viewBox="0 0 20 20" width="18" height="18" fill="#8cc4ff"><path d="M10 1.5l5 6h-3.4V18H8.4V7.5H5z"/></svg><div><small>${esc(tr('VIŠINA'))}</small><b class="a">0<i>m</i></b></div></div>` +
      `<div><svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="#ffd34d" stroke-width="2.2" stroke-linecap="round"><path d="M3.2 14.5a7 7 0 1 1 13.6 0"/><path d="M10 13l3.6-4.6"/></svg><div><small>${esc(tr('HITROST'))}</small><b class="v">0<i>km/h</i></b></div></div>`;
    host.appendChild(menu); host.appendChild(info);
    return { menu, info, a: -1, v: -1, wetN: 0 };
  }
  const rgb = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const hex = (a) => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (h, to, k) => { const a = rgb(h), b = rgb(to); return hex(a.map((v, i) => v + (b[i] - v) * k)); };
  const ink = (h) => { const [r, g, b] = rgb(h); return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#111' : '#fff'; };
  function screen(live) {
    if (!ui) ui = makeUi();
    const show = (el, on, d = 'block') => { const s = on ? d : 'none'; if (el.style.display !== s) el.style.display = s; };
    show(ui.menu, live && S.menu);
    if (live && S.menu) { const sub = ui.menu.querySelector('.sub'), t = (carName() || 'your car') + ' · choose a mission'; if (sub.textContent !== t) sub.textContent = t; }
    const inf = S.carry && (S.mode === 'air' || S.mode === 'land' || (S.mode === 'board' && S.t > 0.9));
    show(ui.info, live && inf, 'flex');
    if (inf) { const a = Math.round(S.alt), v = Math.round(Math.abs(S.vf) * 3.6);
      if (a !== ui.a) { ui.a = a; ui.info.querySelector('.a').firstChild.nodeValue = String(a); } if (v !== ui.v) { ui.v = v; ui.info.querySelector('.v').firstChild.nodeValue = String(v); } }
    if (S.wetN !== ui.wetN) { ui.wetN = S.wetN; note(S.wetK === 'wet' ? tr('Na vodi ne moreš pristati.') : tr('Tu ne moreš pristati.')); }   // (once each time it stops over the water or a roof)
  }
  let noteEl = null, noteT = 0;
  function note(t) { if (!noteEl) { noteEl = document.createElement('div'); noteEl.id = 'nvh-note'; noteEl.style.cssText = 'position:fixed;z-index:7;left:50%;top:40%;transform:translateX(-50%);padding:9px 18px;border-radius:20px;background:rgba(9,13,20,.9);color:#fff;font:700 15px var(--f-ui, Roboto, sans-serif);pointer-events:none'; document.body.appendChild(noteEl); }
    noteEl.textContent = t; noteEl.style.display = 'block'; clearTimeout(noteT); noteT = setTimeout(() => { noteEl.style.display = 'none'; }, 2200); }

  // ---- once the map is built (js/game.js nvStart's hooks, before the still meshes are merged) ----
  let carName = () => '';
  function init(h3, track, o = {}) {
    H3 = h3; trk = track; carName = o.car || carName;
    const B = typeof NVBase !== 'undefined' && NVBase.built, h = B && B.heli; if (!h || !trk) return false;
    if (!hc || hc.src !== h) { hc = h; hc.src = h; hc.parts = build(h); G = h.G; hc.home = { x: G.position.x, y: h.y != null ? h.y : G.position.y, z: G.position.z, psi: Math.PI };
      dust = dustDisc(); fogP.geometry.boundingSphere.center = new THREE.Vector3().copy(G.position); const sc = typeof Render !== 'undefined' && Render.scene; if (sc) { sc.add(G); sc.add(dust); } }
    S = fresh(); seeAt = -1;
    // the bay's floor and ramps are ground, the shell is a wall (over the map's own)
    if (!trk.nvHeli) { g0 = trk.ground2; w0 = trk.wall2; trk.nvHeli = true;
      trk.ground2 = (x, z, y) => { const d = deck(x, z, y); return d != null ? d : g0(x, z, y); };
      trk.wall2 = (x, z, y, out) => wall(x, z, y, out) || (w0 ? w0(x, z, y, out) : false); }
    return true;
  }
  // a restart (the car back at HOME): the helicopter parked on its H again
  function reset() { if (!hc) return; S = fresh(); seeAt = -1; stand = null; topC.clear(); if (ui) { ui.menu.style.display = ui.info.style.display = 'none'; ui.wetN = 0; } }
  // (js/game.js: no Na progo while the car is in it; the tests)
  const on = () => !!S && (S.carry || S.cin || S.onF || S.mode === 'open' || S.mode === 'board');
  const state = () => S && { mode: S.mode, auto: S.auto, x: S.x, z: S.z, y: S.y, psi: S.psi, alt: S.alt, vf: S.vf, w: S.w, fR: S.fR, fF: S.fF, dr: S.dr, xr: S.xr, carry: S.carry, cin: S.cin, onF: S.onF, want: S.want, menu: S.menu, wet: S.wet, blk: S.blk, home: hc && Object.assign({}, hc.home) };
  const choose = (k) => { if (S) S.pick = k; };
  const tp = (x, z) => { if (S) { S.x = x; S.z = z; S.crT = S.blkT = 0; } };   // (the tests: the helicopter flown straight over a place)
  const parts = () => hc && hc.parts;
  return { init, reset, step, post, frame, on, state, choose, tp, parts, deck, wall, topAt, ITEMS };
})();
