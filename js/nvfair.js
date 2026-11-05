// NEW VERSION · TEST 1: the lunapark's rides the car rides (the user's choice 5. 11. 2026, sklop 10 »za pozneje«; docs/nova-mapa-lunapark.md),
// after the gondola and the volcano train (js/nvride.js): the big wheel and the big carousel. The car stops in the yellow frame by the ride and
// stands still a moment: at the big wheel the frame is a plate in the ground, a lift: it takes the car up to the wheel's basket at the bottom,
// the car glides into it (along the axle, nose first), the wheel turns once, the car glides back onto the plate and the plate takes it down;
// at the carousel the car glides onto the deck (its nose to the middle, or its tail if it came in backwards), the carousel goes round once,
// the car glides back into the frame. The camera stays behind the car (js/render.js: it follows the car's height); the carousel's roof goes
// see-through while the car is under it. Nobody riding, the rides turn on their own; a car near and slow, they stop and wait for it (the
// wheel with its basket at the bottom, the carousel with the car's place by the frame). Built by js/nvpark.js (instead of its own big wheel and
// big carousel: the same places, looks and colours), stepped and drawn by js/nvride.js (init, step, post, frame, reset, on); what moves is a few
// meshes of vertex colours (one draw call each), only posed near the camera and in its view, the rest merged with the park (js/nvbake.js).
const NVFair = (function () {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), sst = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }, lerp = (a, b, t) => a + (b - a) * t;
  const wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
  const TAU = Math.PI * 2;
  const RED = 0xd23a2e, WHITE = 0xf4f4f0, STEEL = 0x9aa0a8, DARK = 0x4a4e55, YEL = 0xf2c12e, CONC = 0xb9b5ad, PLATE = 0x6a6e75, CC = [0xe8452c, 0x2a7ad8, 0xf2c12e, 0x3fbf6a, 0xc86bff, 0xff8a2a];
  // the car aboard once still that long (s) in a frame; lift: s the wheel's plate goes up or down; glide: s onto a ride or off it; the car's size
  // that fits (m); near: a car this near a frame and this slow (m, m/s), or nearer than 6 m: the ride stops for it
  const K = { still: 0.8, lift: 1.6, glide: 1.4, maxLen: 5.2, maxWid: 2.5, near: 14, nearV: 9 };
  // the big wheel (js/nvpark.js J.KOLO, its axle along x): R its radius, n gondolas, the rims half apart either side of the middle, the basket
  // (bl long along the axle, bw wide) its floor hang under its bar; the A-frames legX out, their feet legZ either way; the plate pdx m west of it
  // (phl, phw: its half length and width), tol: how far the car's middle may be off the plate's (m along, across); turns (rad/s, rad/s²)
  const WH = { x: 5.5, z: -28, R: 8, n: 12, half: 3.05, hang: 2.6, bl: 5.6, bw: 2.9, legX: 3.65, legZ: 5.8, pdx: -7.4, phl: 3.1, phw: 1.8, tol: [1.2, 0.75], wIdle: 0.2, wDock: 0.7, wRide: 0.36, acc: 0.12 };
  // the big carousel (J.VRT): r its deck's radius (0.5 m high), n places round it (the car's at 0, towards the frame: no horse there), the car's
  // middle rc from the middle; the frame bdx m east of it (bhl, bhw: its half length and width)
  const CA = { x: 35.25, z: -120.91, r: 7.2, n: 10, rc: 3.7, bdx: 12.35, bhl: 3.0, bhw: 1.6, tol: [1.2, 0.75], wIdle: 0.55, wDock: 1.0, wRide: 0.55, acc: 0.25, c1: '#e8452c', c2: '#f4f4f0' };

  // ---- parts of one colour each merged into one mesh (vertex colours) ----
  function kit() {
    const L = [], o3 = new THREE.Object3D(), UP = new THREE.Vector3(0, 1, 0);
    const push = (g, c, x, y, z, rx, ry, rz) => { o3.position.set(x, y, z); o3.rotation.set(rx || 0, ry || 0, rz || 0); o3.scale.set(1, 1, 1); o3.updateMatrix(); L.push({ g, m: o3.matrix.clone(), c }); };
    const k = { L,
      box(w, h, d, c, x, y, z, rx, ry, rz) { push(new THREE.BoxGeometry(w, h, d), c, x, y, z, rx, ry, rz); },
      cyl(r0, r1, h, c, x, y, z, rx, ry, rz, seg, open) { push(new THREE.CylinderGeometry(r0, r1, h, seg || 10, 1, !!open), c, x, y, z, rx, ry, rz); },
      torus(r, t, c, x, y, z, seg) { push(new THREE.TorusGeometry(r, t, 4, seg || 24), c, x, y, z); },
      rod(a, b, r, c, seg) { const A = new THREE.Vector3(a[0], a[1], a[2]), B = new THREE.Vector3(b[0], b[1], b[2]), d = B.clone().sub(A), l = d.length(); if (l < 1e-4) return;
        o3.position.copy(A).add(B).multiplyScalar(0.5); o3.quaternion.setFromUnitVectors(UP, d.multiplyScalar(1 / l)); o3.scale.set(1, 1, 1); o3.updateMatrix(); L.push({ g: new THREE.CylinderGeometry(r, r, l, seg || 5, 1, true), m: o3.matrix.clone(), c }); } };
    return k;
  }
  function merge(L) {
    let n = 0; const gs = L.map(p => { const g = p.g.index ? p.g.toNonIndexed() : p.g.clone(); g.applyMatrix4(p.m); if (!g.attributes.normal) g.computeVertexNormals(); n += g.attributes.position.count; p.g.dispose(); return [g, p.c]; });
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), c = new THREE.Color(); let o = 0;
    for (const [g, hex] of gs) { c.setHex(hex); const m = g.attributes.position.count; pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3);
      for (let i = 0; i < m; i++) { col[(o + i) * 3] = c.r; col[(o + i) * 3 + 1] = c.g; col[(o + i) * 3 + 2] = c.b; } o += m; g.dispose(); }
    const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.BufferAttribute(pos, 3)); G.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); G.setAttribute('color', new THREE.BufferAttribute(col, 3));
    G.computeBoundingSphere(); return G;
  }
  // (parts that each move on their own in one mesh: their vertices moved every frame, from where they were built round their own middle)
  function join(gs) {
    let n = 0; for (const g of gs) n += g.attributes.position.count;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), parts = []; let o = 0;
    for (const g of gs) { const m = g.attributes.position.count; pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); col.set(g.attributes.color.array, o * 3); parts.push([o * 3, m * 3]); o += m; g.dispose(); }
    const G = new THREE.BufferGeometry(), pa = new THREE.BufferAttribute(pos, 3); pa.setUsage(THREE.DynamicDrawUsage); G.setAttribute('position', pa); G.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); G.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return { G, base: pos.slice(), parts };
  }
  let VC = null; const mats = () => { if (!VC) VC = new THREE.MeshLambertMaterial({ vertexColors: true }); };
  const dyn = (m, cast = true) => { m.castShadow = cast; m.receiveShadow = true; m.userData.dyn = true; return m; };
  // what moves past the fog not drawn, as the map's merged cells (js/render.js world.cullFog); posed only near the camera and in its view (js/nvride.js seen)
  function fogOf(obj, x, y, z, r) { return { obj, geometry: { boundingSphere: { center: new THREE.Vector3(x, y, z), radius: r } }, on: true, get visible() { return this.on; }, set visible(v) { this.on = v; obj.visible = v; } }; }
  function fogIn(p) { const W = typeof Render !== 'undefined' && Render.world; if (W && W.cullFog && !W.cullFog.includes(p)) W.cullFog.push(p); }
  const seen = (p) => p.on && (typeof NVRide === 'undefined' || !NVRide.seen || NVRide.seen(p.geometry.boundingSphere.center.x, p.geometry.boundingSphere.center.y, p.geometry.boundingSphere.center.z, p.geometry.boundingSphere.radius));
  // a box (middle x, z; along h half hl, across half hw) as the car's wall: out [nx, nz, depth] (js/core.js wall2)
  function boxWall(x, z, cx, cz, h, hl, hw, out) {
    const c = Math.cos(h), s = Math.sin(h), dx = x - cx, dz = z - cz, u = dx * c + dz * s, v = -dx * s + dz * c; if (Math.abs(u) >= hl || Math.abs(v) >= hw) return false;
    const dS = hw - Math.abs(v), dE = hl - Math.abs(u); if (dS < dE) { const sv = v < 0 ? -1 : 1; out[0] = -s * sv; out[1] = c * sv; out[2] = dS; } else { const su = u < 0 ? -1 : 1; out[0] = c * su; out[1] = s * su; out[2] = dE; } return true;
  }
  // a frame on the ground (yellow, a chevron in it pointing hd), its parts for a kit or still meshes
  function frameParts(add, hl, hw, hd) {
    const e = 0.18, t = 0.03; add(hl * 2, t, e, 0, hw - e / 2); add(hl * 2, t, e, 0, -hw + e / 2); add(e, t, hw * 2 - e * 2, hl - e / 2, 0); add(e, t, hw * 2 - e * 2, -hl + e / 2, 0);
    for (const cx of [-0.15, 0.85]) for (const s of [-1, 1]) add(0.86, t, 0.17, (cx - 0.2) * Math.cos(hd) - s * 0.25 * Math.sin(hd), (cx - 0.2) * Math.sin(hd) + s * 0.25 * Math.cos(hd), -hd + s * 0.62);
  }

  /* ======================= the big wheel ======================= */
  let WB = null;
  function wheelBuild(MK, gy, L) {
    const T = WH, R = T.R, pl = { x: T.x + T.pdx, z: T.z, hl: T.phl, hw: T.phw };
    // the basket's floor at the bottom just over the highest ground under it (the drift ring's hill rises under the wheel's east side), the
    // wheel's middle from it; the plate's top just over the highest ground under it
    let gM = -1e9; for (let a = -T.bl / 2; a <= T.bl / 2 + 1e-6; a += T.bl / 8) for (let b = -T.bw / 2; b <= T.bw / 2 + 1e-6; b += T.bw / 4) gM = Math.max(gM, gy(T.x + a, T.z + b));
    let pM = -1e9; for (let a = -pl.hl; a <= pl.hl + 1e-6; a += pl.hl / 4) for (let b = -pl.hw; b <= pl.hw + 1e-6; b += pl.hw / 2) pM = Math.max(pM, gy(pl.x + a, pl.z + b));
    const yF = gM + 0.3, cy = yF + T.hang + R, y0 = pM + 0.03;
    // (a frame of the wheel's own: x → world -z, y up, z → world x; the axle along z, the wheel in x, y)
    const frame = () => { const g = new THREE.Group(); g.position.set(T.x, cy, T.z); g.rotation.y = Math.PI / 2; MK.add(g); return g; };
    // the still parts (merged with the park): the axle on two A-frames outside the rims, their feet on the ground either side, a brace across
    // each, concrete feet
    { const g = frame(), stl = L(STEEL), conc = L(CONC), UP = new THREE.Vector3(0, 1, 0);
      const put = (me) => { me.castShadow = true; me.receiveShadow = true; g.add(me); return me; };
      const rodM = (a, b, r) => { const A = new THREE.Vector3(a[0], a[1], a[2]), B = new THREE.Vector3(b[0], b[1], b[2]), d = B.clone().sub(A), l = d.length(), me = put(new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, 6), stl)); me.position.copy(A).add(B).multiplyScalar(0.5); me.quaternion.setFromUnitVectors(UP, d.normalize()); };
      rodM([0, 0, -T.legX - 0.45], [0, 0, T.legX + 0.45], 0.32);
      for (const s of [-1, 1]) { const lz = s * T.legX, ft = [-1, 1].map(e => [e * T.legZ, gy(T.x + lz, T.z - e * T.legZ) - cy - 0.15, lz]);
        for (const f of ft) { rodM([0, 0, lz], f, 0.28); const pad = put(new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.6, 1.3), conc)); pad.position.set(f[0], f[1] + 0.3, lz); }
        const yb = -5.6, k0 = yb / ft[0][1], k1 = yb / ft[1][1]; rodM([ft[0][0] * k0, yb, lz], [ft[1][0] * k1, yb, lz], 0.16); }
    }
    mats(); const g = frame(), rot = new THREE.Group(); g.add(rot);
    // the rotor (it turns): two rims with their spokes, a bar across at each gondola, the hub
    { const k = kit(); for (const s of [-T.half, T.half]) { k.torus(R, 0.2, WHITE, 0, 0, s, 28);
        for (let q = 0; q < T.n; q++) { const a = -Math.PI / 2 + q / T.n * TAU; k.rod([0, 0, s], [Math.cos(a) * R, Math.sin(a) * R, s], 0.07, WHITE, 3); } }
      for (let q = 0; q < T.n; q++) { const a = -Math.PI / 2 + q / T.n * TAU; k.rod([Math.cos(a) * R, Math.sin(a) * R, -T.half - 0.15], [Math.cos(a) * R, Math.sin(a) * R, T.half + 0.15], 0.1, STEEL, 4); }
      k.cyl(0.8, 0.8, T.half * 2 - 0.3, RED, 0, 0, 0, Math.PI / 2, 0, 0, 10); rot.add(dyn(new THREE.Mesh(merge(k.L), VC))); }
    // what hangs from the bars (level as the wheel turns): the basket for the car (a dark floor, a red cage open at its ends for the car to
    // glide in along the axle, yellow rails at its sides) and eleven gondolas, one mesh
    const parts = [];
    { const k = kit(), h = T.hang, x1 = T.bw / 2, z1 = T.bl / 2 - 0.05; k.box(T.bw, 0.14, T.bl, DARK, 0, -h - 0.07, 0);
      for (const sx of [-x1, x1]) { for (const sz of [-z1, z1]) k.rod([sx, -h, sz], [sx, 0.07, sz], 0.07, RED, 4); k.rod([sx, 0.07, -z1], [sx, 0.07, z1], 0.07, RED, 4); k.rod([sx, -h + 0.55, -z1], [sx, -h + 0.55, z1], 0.05, YEL, 4); }
      for (const sz of [-z1, z1]) k.rod([-x1, 0.07, sz], [x1, 0.07, sz], 0.07, RED, 4); parts.push(merge(k.L)); }
    for (let q = 1; q < T.n; q++) { const k = kit(); k.rod([0, 0, 0], [0, -0.74, 0], 0.06, STEEL, 3);
      k.box(1.5, 0.12, 2.5, WHITE, 0, -0.78, 0); k.box(1.3, 1.15, 2.3, CC[q % CC.length], 0, -1.42, 0); parts.push(merge(k.L)); }
    // in the same mesh (no draw call of its own): the plate (a lift in the ground: up, it takes the car to the basket's floor), steel with a
    // yellow frame and a chevron towards the wheel, its rams under it; then the concrete edge round it (it stays); built along x, turned into
    // the wheel's frame
    const toW = new THREE.Matrix4().makeRotationY(-Math.PI / 2).setPosition(0, y0 - cy, T.pdx);
    { const k = kit(); k.box(pl.hl * 2, 0.3, pl.hw * 2, PLATE, 0, -0.15, 0); for (const sx of [-1.6, 1.6]) k.cyl(0.22, 0.22, 3.4, 0xc9ccd0, sx, -1.9, 0, 0, 0, 0, 6, true);
      frameParts((w, t, d, x, z, ry) => k.box(w, t, d, YEL, x, t / 2 - 0.01, z, 0, ry || 0, 0), pl.hl - 0.12, pl.hw - 0.12, 0); const G = merge(k.L); G.applyMatrix4(toW); parts.push(G); }
    { const k = kit(); for (const [w, d, x, z] of [[pl.hl * 2 + 0.7, 0.35, 0, pl.hw + 0.17], [pl.hl * 2 + 0.7, 0.35, 0, -pl.hw - 0.17], [0.35, pl.hw * 2, pl.hl + 0.17, 0], [0.35, pl.hw * 2, -pl.hl - 0.17, 0]]) k.box(w, 0.5, d, CONC, x, -0.26, z);
      const G = merge(k.L); G.applyMatrix4(toW); parts.push(G); }
    const HP = join(parts), hm = dyn(new THREE.Mesh(HP.G, VC)), bs = new THREE.Vector3(0, -3, -2); HP.G.boundingSphere = new THREE.Sphere(bs, R + 9); g.add(hm);
    const B = { g, rot, hm, HP, pl, cy, yF, y0, fpW: fogOf(g, T.x - 2, cy - 3, T.z, R + 9) };
    B.S = wheelFresh(0); return B;
  }
  function wheelFresh(phi) { return { mode: 'free', t: 0, phi, prevPhi: phi, phi0: 0, w: 0, k: 0, prevK: 0, still: 0, arm: true, carry: false, from: null, dh: 0, prev: null, rides: 0 }; }
  function wheelPose(a) {
    const B = WB; if (!B) return; const S = B.S, T = WH;
    const phi = lerp(S.prevPhi, S.phi, a), k = lerp(S.prevK, S.k, a); B.rot.rotation.z = phi;
    const P = B.HP.G.attributes.position, A = P.array, base = B.HP.base;
    for (let q = 0; q < T.n; q++) { const b = -Math.PI / 2 + q / T.n * TAU + phi, ox = Math.cos(b) * T.R, oy = Math.sin(b) * T.R, [o, m] = B.HP.parts[q];
      for (let i = o; i < o + m; i += 3) { A[i] = base[i] + ox; A[i + 1] = base[i + 1] + oy; A[i + 2] = base[i + 2]; } }
    { const dy = (B.yF - B.y0) * k, [o, m] = B.HP.parts[T.n]; for (let i = o + 1; i < o + m; i += 3) A[i] = base[i] + dy; }   // (the plate)
    P.needsUpdate = true;
  }
  // the basket's floor and its middle along z (the car in it), at the wheel's turn phi (0: at the bottom)
  const basket = (phi) => ({ y: WB.cy - WH.R * Math.cos(phi) - WH.hang, z: WH.z - WH.R * Math.sin(phi) });
  function wheelStep(dt, P) {
    const B = WB, S = B.S, T = WH, pl = B.pl;
    if (S.mode === 'free' && S.phi >= TAU) S.phi -= TAU;
    S.prevPhi = S.phi; S.prevK = S.k; S.prev = S.carry ? { x: P.x, z: P.z, h: P.h } : null;
    const sp = Math.hypot(P.vx || 0, P.vz || 0), dx = P.x - pl.x, dz = P.z - pl.z, d = Math.hypot(dx, dz), near = (d < K.near && sp < K.nearV) || d < 6;
    if (S.mode === 'free') {   // the car in the frame on the plate, the basket at the bottom, still a moment: up it goes
      const fits = !P.m || (P.m.len <= K.maxLen && P.m.wid <= K.maxWid), inBox = Math.abs(dx) < T.tol[0] && Math.abs(dz) < T.tol[1] && Math.abs(Math.sin(P.h)) < 0.5 && Math.abs((P.y || 0) - B.y0) < 0.5 && fits;
      if (!inBox) S.arm = true;   // (again only once it has left the frame)
      const docked = S.w === 0 && Math.abs(S.phi - Math.round(S.phi / TAU) * TAU) < 1e-3; S.still = inBox && sp < 0.5 && S.arm && docked ? S.still + dt : 0;
      if (S.still > K.still) { S.mode = 'lift'; S.t = 0; S.carry = true; S.from = { x: P.x, z: P.z, h: P.h }; S.dh = Math.cos(P.h) >= 0 ? 0 : Math.PI; S.phi = S.prevPhi = Math.round(S.phi / TAU) * TAU; }
    }
    if (S.mode === 'lift') { S.t += dt; S.k = sst(S.t / K.lift); if (S.t >= K.lift) { S.mode = 'in'; S.t = 0; S.k = 1; } }
    else if (S.mode === 'in') { S.t += dt; if (S.t >= K.glide) { S.mode = 'ride'; S.t = 0; S.phi0 = S.phi; S.w = 0; } }
    else if (S.mode === 'out') { S.t += dt; if (S.t >= K.glide) { S.mode = 'down'; S.t = 0; } }
    else if (S.mode === 'down') { S.t += dt; S.k = 1 - sst(S.t / K.lift); if (S.t >= K.lift) { S.mode = 'free'; S.k = 0; S.carry = false; S.arm = false; S.still = 0; S.rides++; } }
    if (turn(S, T, dt, near)) { const f = Math.round(S.phi / TAU) * TAU; S.phi -= f; S.prevPhi -= f; S.mode = 'out'; S.t = 0; }
    if (S.carry) wheelSeat(P);
  }
  // the car on the plate, gliding in or out, in the basket (in its middle, along the axle)
  function wheelSeat(P) {
    const B = WB, S = B.S, T = WH, pl = B.pl; let x, z, h;
    if (S.mode === 'lift') { x = S.from.x; z = S.from.z; h = S.from.h; }
    else if (S.mode === 'down') { x = pl.x; z = pl.z; h = S.dh; }
    else if (S.mode === 'in') { const k = sst(S.t / K.glide), f = S.from; x = lerp(f.x, T.x, k); z = lerp(f.z, T.z, k); h = f.h + wrap(S.dh - f.h) * k; }
    else if (S.mode === 'out') { const k = sst(S.t / K.glide); x = lerp(T.x, pl.x, k); z = lerp(T.z, pl.z, k); h = S.dh; }
    else { x = T.x; z = basket(S.phi).z; h = S.dh; }
    seat(P, x, z, h);
  }
  // the car's ground: on the plate (down, going up or down), between it and the basket while it glides, the basket's floor
  function wheelGround(x, z, y) {
    const B = WB; if (!B) return null; const S = B.S, T = WH, pl = B.pl; if (Math.abs(x - T.x) > 16 || Math.abs(z - T.z) > 16) return null;
    const onPl = Math.abs(x - pl.x) <= pl.hl && Math.abs(z - pl.z) <= pl.hw;
    if (!S.carry) return onPl && !(y != null && y < B.y0 - 0.6) ? B.y0 : null;
    if (S.mode === 'lift' || S.mode === 'down') return onPl ? lerp(B.y0, B.yF, S.k) : null;
    if (S.mode === 'in' || S.mode === 'out') return x >= pl.x - pl.hl - 1 && x <= T.x + T.bl / 2 + 1 && Math.abs(z - T.z) <= T.bw / 2 + 0.6 ? B.yF : null;
    const b = basket(S.phi); return Math.abs(x - T.x) <= T.bl / 2 + 1 && Math.abs(z - b.z) <= T.bw / 2 + 0.6 ? b.y : null;
  }
  // under the wheel, between its legs: no way through (not while the car rides it)
  function wheelWall(x, z, y, out) { const B = WB; if (!B || B.S.carry) return false; return boxWall(x, z, WH.x, WH.z, 0, WH.legX + 0.7, WH.legZ + 0.7, out); }

  /* ======================= the big carousel ======================= */
  let CB = null;
  function carouselBuild(MK, gy, L, STR) {
    const T = CA, r = T.r, yG = gy(T.x, T.z), bx = T.x + T.bdx, bz = T.z;
    // the still parts (merged with the park): the deck, the middle post; the frame on the grass east of it (a chevron towards the deck)
    { const g = new THREE.Group(); g.position.set(T.x, yG + 0.25, T.z); MK.add(g);
      const put = (me, y) => { me.position.y = y; me.castShadow = true; me.receiveShadow = true; g.add(me); };
      put(new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.5, 16), L(0xe8dcc0)), 0); put(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 4, 10), L(YEL)), 2.2);
      const f = new THREE.Group(); MK.add(f); frameParts((w, t, d, x, z, ry) => { const me = new THREE.Mesh(new THREE.BoxGeometry(w, t, d), L(YEL)); me.position.set(bx + x, gy(bx + x, bz + z) + 0.1, bz + z); me.rotation.y = ry || 0; me.receiveShadow = true; f.add(me); }, T.bhl, T.bhw, Math.PI); }
    // what moves: the roof (see-through while the car is under it), the poles and the horses going round (each horse up and down as it goes)
    mats(); const g = new THREE.Group(); g.position.set(T.x, yG + 0.25, T.z); MK.add(g);
    const tex = STR ? STR(T.c1, T.c2, 16) : null, rfM = new THREE.MeshLambertMaterial({ color: tex ? 0xffffff : 0xe8452c, map: tex, transparent: true, opacity: 1 });
    const rf = dyn(new THREE.Mesh(new THREE.ConeGeometry(r + 0.6, 2.4, 16, 1), rfM)); rf.position.y = 4.6; g.add(rf);
    const spin = new THREE.Group(); g.add(spin);
    { const k = kit(); for (let q = 1; q < T.n; q++) { const a = q / T.n * TAU; k.cyl(0.05, 0.05, 3.4, YEL, Math.cos(a) * (r - 1), 1.9, Math.sin(a) * (r - 1), 0, 0, 0, 4); } spin.add(dyn(new THREE.Mesh(merge(k.L), VC), false)); }
    const hg = new THREE.BoxGeometry(0.4, 0.8, 1.0); hg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1.4, 0), r + 0.5);
    const horses = dyn(new THREE.InstancedMesh(hg, new THREE.MeshLambertMaterial({ color: 0xffffff }), T.n - 1), false); for (let q = 1; q < T.n; q++) horses.setColorAt(q - 1, new THREE.Color([0xf4f4f0, 0x8a5a3a, 0x2a2622][q % 3])); g.add(horses);
    const B = { g, rf, rfM, spin, horses, yG, yD: yG + 0.5, bx, bz, op: 1, fp: fogOf(g, T.x, yG + 3, T.z, r + 1) };
    B.S = caroFresh(0); return B;
  }
  function caroFresh(phi) { return { mode: 'free', t: 0, phi, prevPhi: phi, phi0: 0, w: 0, still: 0, arm: true, carry: false, from: null, dh: 0, prev: null, rides: 0 }; }
  const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s1 = new THREE.Vector3(1, 1, 1);
  function caroPose(a) {
    const B = CB; if (!B) return; const S = B.S, T = CA, phi = lerp(S.prevPhi, S.phi, a); B.spin.rotation.y = -phi;
    for (let q = 1; q < T.n; q++) { const th = q / T.n * TAU + phi; _e.set(0, -th, 0); _q.setFromEuler(_e); _v.set(Math.cos(th) * (T.r - 1), 1.4 + 0.3 * Math.sin(phi * 4.4 + q * 1.3), Math.sin(th) * (T.r - 1)); B.horses.setMatrixAt(q - 1, _m4.compose(_v, _q, _s1)); }
    B.horses.instanceMatrix.needsUpdate = true;
  }
  // the car's place on the deck (its middle, its heading) at the carousel's turn phi (0: by the frame)
  const place = (phi) => ({ x: CA.x + CA.rc * Math.cos(phi), z: CA.z + CA.rc * Math.sin(phi), h: phi + CB.S.dh });
  function caroStep(dt, P) {
    const B = CB, S = B.S, T = CA;
    if (S.mode === 'free' && S.phi >= TAU) S.phi -= TAU;
    S.prevPhi = S.phi; S.prev = S.carry ? { x: P.x, z: P.z, h: P.h } : null;
    const sp = Math.hypot(P.vx || 0, P.vz || 0), dx = P.x - B.bx, dz = P.z - B.bz, d = Math.hypot(dx, dz), near = (d < K.near && sp < K.nearV) || d < 6;
    if (S.mode === 'free') {   // the car in the frame, the carousel stopped with the car's place by it, still a moment: onto the deck
      const fits = !P.m || (P.m.len <= K.maxLen && P.m.wid <= K.maxWid), inBox = Math.abs(dx) < T.tol[0] && Math.abs(dz) < T.tol[1] && Math.abs(Math.sin(P.h)) < 0.5 && Math.abs((P.y || 0) - B.yG) < 0.5 && fits;
      if (!inBox) S.arm = true;   // (again only once it has left the frame)
      const docked = S.w === 0 && Math.abs(S.phi - Math.round(S.phi / TAU) * TAU) < 1e-3; S.still = inBox && sp < 0.5 && S.arm && docked ? S.still + dt : 0;
      if (S.still > K.still) { S.mode = 'in'; S.t = 0; S.carry = true; S.from = { x: P.x, z: P.z, h: P.h }; S.dh = Math.cos(P.h) < 0 ? Math.PI : 0; S.phi = S.prevPhi = Math.round(S.phi / TAU) * TAU; }
    }
    if (S.mode === 'in') { S.t += dt; if (S.t >= K.glide) { S.mode = 'ride'; S.t = 0; S.phi0 = S.phi; S.w = 0; } }
    else if (S.mode === 'out') { S.t += dt; if (S.t >= K.glide) { S.mode = 'free'; S.carry = false; S.arm = false; S.still = 0; S.rides++; } }
    if (turn(S, T, dt, near)) { const f = Math.round(S.phi / TAU) * TAU; S.phi -= f; S.prevPhi -= f; S.mode = 'out'; S.t = 0; }
    if (S.carry) caroSeat(P);
  }
  function caroSeat(P) {
    const B = CB, S = B.S, p = place(S.phi); let x = p.x, z = p.z, h = p.h;
    if (S.mode === 'in') { const k = sst(S.t / K.glide), f = S.from; x = lerp(f.x, p.x, k); z = lerp(f.z, p.z, k); h = f.h + wrap(p.h - f.h) * k; }
    else if (S.mode === 'out') { const k = sst(S.t / K.glide); x = lerp(p.x, B.bx, k); z = lerp(p.z, B.bz, k); }
    seat(P, x, z, h);
  }
  // the car's ground: up onto the deck and down off it as it glides, the deck under it as it goes round
  function caroGround(x, z, y) {
    const B = CB; if (!B || !B.S.carry) return null; const S = B.S, T = CA; if (Math.abs(x - T.x) > 20 || Math.abs(z - T.z) > 12) return null;
    if (S.mode === 'in' || S.mode === 'out') { const k = sst(S.t / K.glide); return x >= T.x + T.rc - 3.5 && x <= B.bx + T.bhl + 1 && Math.abs(z - T.z) <= 2.2 ? lerp(B.yG, B.yD, S.mode === 'in' ? k : 1 - k) : null; }
    const p = place(S.phi); return (x - p.x) ** 2 + (z - p.z) ** 2 < 3.6 * 3.6 ? B.yD : null;
  }
  // the deck's edge: a wall (not while the car rides it)
  function caroWall(x, z, y, out) {
    const B = CB; if (!B || B.S.carry) return false; const T = CA, R0 = T.r + 0.15, dx = x - T.x, dz = z - T.z, d2 = dx * dx + dz * dz; if (d2 >= R0 * R0 || y > B.yD + 1.5) return false;
    const d = Math.sqrt(d2) || 1e-6; out[0] = dx / d; out[1] = dz / d; out[2] = R0 - d; return true;
  }

  /* ======================= both ======================= */
  // a ride's turn: on its own (its own speed), to its stop (a car near: the car's place at the frame, phi a whole turn), once round with the
  // car (speeding up, on, slowing down to stop where it started; true: done)
  function turn(S, D, dt, near) {
    if (S.mode === 'ride') { const left = S.phi0 + TAU - S.phi, vb = Math.sqrt(Math.max(0, 2 * D.acc * left)); S.w = Math.min(D.wRide, S.w + D.acc * dt, vb + 0.02); S.phi = Math.min(S.phi0 + TAU, S.phi + S.w * dt);
      if (S.phi >= S.phi0 + TAU - 1e-4) { S.phi = S.phi0 + TAU; S.w = 0; return true; } return false; }
    if (S.mode !== 'free') { S.w = 0; return false; }
    if (near) { const tgt = Math.ceil(S.phi / TAU - 1e-6) * TAU, left = tgt - S.phi; if (left < 1e-4) { S.phi = tgt; S.w = 0; return false; }
      S.w = Math.min(D.wDock, S.w + D.acc * dt, Math.sqrt(2 * D.acc * left) + 0.02); S.phi = Math.min(tgt, S.phi + S.w * dt); if (S.phi >= tgt) S.w = 0; }
    else { S.w += clamp(D.wIdle - S.w, -D.acc * dt, D.acc * dt); S.phi += S.w * dt; }
    return false;
  }
  // the car held where the ride has it (no speed, no input: it rides)
  function seat(P, x, z, h) { P.x = x; P.z = z; P.h = h; P.vx = P.vz = 0; P.w = 0; if (P.nvA) P.nvA = 0; P.inThr = 0; P.inBrk = 0; P.inSteer = 0; P.steer = 0; P.inHand = 0; }

  /* ======================= the hooks ======================= */
  // (js/nvpark.js build: the rides instead of its own; L its materials (one per colour: merged by it), STR its striped textures)
  function build(MK, o = {}) {
    const H3 = MK.H3, gy = (x, z) => H3.ground(x, z), L = o.L || ((c) => new THREE.MeshLambertMaterial({ color: c })), J = o.J;
    if (J && J.KOLO) { WH.x = J.KOLO[0]; WH.z = J.KOLO[1]; WH.R = J.KOLO[2]; } if (J && J.VRT) { CA.x = J.VRT[0]; CA.z = J.VRT[1]; }
    WB = wheelBuild(MK, gy, L); CB = carouselBuild(MK, gy, L, o.STR); wheelPose(1); caroPose(1); return { wheel: WB, carousel: CB };
  }
  // (js/nvpark.js: no trees or people here: the frames and the way into them)
  const clear = () => [[WH.x + WH.pdx, WH.z], [WH.x + WH.pdx - 6, WH.z], [CA.x + CA.bdx, CA.z], [CA.x + CA.bdx + 6, CA.z]];
  let trk = null;
  function init(h3, track) {
    if (!WB || !CB || !track) return false; trk = track; fogIn(WB.fpW); fogIn(CB.fp); reset();
    if (!trk.nvFair) { const g0 = trk.ground2, w0 = trk.wall2; trk.nvFair = true;
      trk.ground2 = (x, z, y) => { let d = wheelGround(x, z, y); if (d == null) d = caroGround(x, z, y); return d != null ? d : g0(x, z, y); };
      trk.wall2 = (x, z, y, out) => wheelWall(x, z, y, out) || caroWall(x, z, y, out) || (w0 ? w0(x, z, y, out) : false); }
    return true;
  }
  function reset() { if (WB) { WB.S = wheelFresh(WB.S ? WB.S.phi % TAU : 0); wheelPose(1); } if (CB) { CB.S = caroFresh(CB.S ? CB.S.phi % TAU : 0); caroPose(1); CB.op = 1; CB.rfM.opacity = 1; CB.rfM.depthWrite = true; } }
  function step(dt, P) {
    if (!WB || !CB || !P) return; wheelStep(dt, P); caroStep(dt, P);   // (the frames far apart: the car in one ride at most)
    if (WB.S.carry || CB.S.carry) P.stuckT = 0;
    if (WB.S.carry || seen(WB.fpW)) wheelPose(1); if (CB.S.carry || seen(CB.fp)) caroPose(1);
  }
  // (after the car's step: drawn from where the ride had it the step before, as the ride itself)
  function post(P) { if (!WB || !P) return; for (const S of [WB.S, CB.S]) if (S.carry && S.prev) { P.px = S.prev.x; P.pz = S.prev.z; P.ph = S.prev.h; P.stuckT = 0; } }
  function frame(dt, alpha) {
    if (!WB || !CB) return; const a = alpha == null ? 1 : clamp(alpha, 0, 1);
    if (WB.S.carry || seen(WB.fpW)) wheelPose(a);
    const want = CB.S.carry ? 0.3 : 1; if (Math.abs(CB.op - want) > 1e-3) { CB.op += (want - CB.op) * (1 - Math.exp(-Math.max(0, dt || 0) * 5)); if (Math.abs(CB.op - want) < 0.01) CB.op = want; CB.rfM.opacity = CB.op; CB.rfM.depthWrite = CB.op > 0.98; }
    if (CB.S.carry || seen(CB.fp)) caroPose(a);
  }
  const on = () => !!((WB && WB.S.carry) || (CB && CB.S.carry));
  // (the tests: where each ride is, its state; a place in its frame)
  const state = () => WB && CB && { wheel: { mode: WB.S.mode, phi: WB.S.phi, w: WB.S.w, k: WB.S.k, carry: WB.S.carry, rides: WB.S.rides, still: WB.S.still, cy: WB.cy, yF: WB.yF, y0: WB.y0, plate: Object.assign({}, WB.pl), basket: basket(WB.S.phi) },
    carousel: { mode: CB.S.mode, phi: CB.S.phi, w: CB.S.w, carry: CB.S.carry, rides: CB.S.rides, still: CB.S.still, yG: CB.yG, yD: CB.yD, box: { x: CB.bx, z: CB.bz }, op: CB.op, place: CB.S.carry ? place(CB.S.phi) : null } };
  const spot = (which, back) => which === 'wheel' ? { x: WB.pl.x, z: WB.pl.z, h: back ? Math.PI : 0 } : { x: CB.bx, z: CB.bz, h: back ? 0 : Math.PI };
  return { build, clear, init, reset, step, post, frame, on, state, spot, K, WH, CA };
})();
