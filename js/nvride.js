// NEW VERSION · TEST 1: what the car rides on the new map (sklop 10, as the user chose it in the pictures). The gondola for cars up the
// hill (gond-page: no boxes, no switching to it; you drive your car into a cabin, the door behind you closes, the cabin rides up, at the top
// the door in front opens and you drive out): two big cabins on two tracks, one at the top while the other is at the bottom, set off
// together and pass each other half way (an aerial tramway); their roofs glass in a red frame (the car inside shows from the camera
// behind it); stations with a deck at the cabins' floor, a ramp for the cars up to each dock, a glass roof; towers where the rope bends.
// The doors fold down onto the deck as bridges. Nobody riding and the car away from the stations, the cabins shuttle on their own.
// Built by js/newmap.js hub4G (gondola(), instead of the old gondola), the stations and towers merged with the still meshes (js/nvbake.js),
// the cabins moving on their own (a few draw calls). The car rides in a cabin: its floor is the car's ground (js/core.js track.ground2), its
// walls and shut doors the car's walls (track.wall2), the stations' decks and ramps too (by the car's height: from below they are walls).
// Loaded with the new map (js/game.js nvStart); stepped with the race (js/game.js stepRace: step before the cars move, post after them),
// drawn between the steps (frame).
const NVRide = (function () {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), sst = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
  const tr = (s) => (typeof Lang !== 'undefined' && Lang.tr ? Lang.tr(s) : s);

  // ---- parts of one colour each merged into one mesh (vertex colours: one draw call) ----
  function kit() {
    const L = [], o3 = new THREE.Object3D();
    const push = (g, c, x, y, z, rx, ry, rz) => { o3.position.set(x, y, z); o3.rotation.set(rx || 0, ry || 0, rz || 0); o3.quaternion.setFromEuler(o3.rotation); o3.updateMatrix(); L.push({ g, m: o3.matrix.clone(), c }); };
    return { L,
      box(w, h, d, c, x, y, z, rx, ry, rz) { push(new THREE.BoxGeometry(w, h, d), c, x, y, z, rx, ry, rz); },
      cyl(r0, r1, h, c, x, y, z, rx, ry, rz, seg) { push(new THREE.CylinderGeometry(r0, r1, h, seg || 10), c, x, y, z, rx, ry, rz); },
      torus(r, t, c, x, y, z, rx, ry, rz, seg) { push(new THREE.TorusGeometry(r, t, 6, seg || 20), c, x, y, z, rx, ry, rz); },
      rod(a, b, r, c, seg) { const A = new THREE.Vector3(a[0], a[1], a[2]), B = new THREE.Vector3(b[0], b[1], b[2]), d = B.clone().sub(A), l = d.length(); if (l < 1e-4) return;
        o3.position.copy(A).add(B).multiplyScalar(0.5); o3.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.multiplyScalar(1 / l)); o3.scale.set(1, 1, 1); o3.updateMatrix(); L.push({ g: new THREE.CylinderGeometry(r, r, l, seg || 6), m: o3.matrix.clone(), c }); },
      geo(g, c) { L.push({ g, m: new THREE.Matrix4(), c }); },
      mesh(mat) { return new THREE.Mesh(merge(L), mat); } };
  }
  function merge(L) {
    let n = 0; const gs = L.map(p => { const g = p.g.index ? p.g.toNonIndexed() : p.g.clone(); g.applyMatrix4(p.m); n += g.attributes.position.count; p.g.dispose(); return [g, p.c]; });
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), c = new THREE.Color(); let o = 0;
    for (const [g, hex] of gs) { c.setHex(hex); pos.set(g.attributes.position.array, o * 3); if (!g.attributes.normal) g.computeVertexNormals(); nor.set(g.attributes.normal.array, o * 3);
      for (let k = 0; k < g.attributes.position.count; k++) { col[(o + k) * 3] = c.r; col[(o + k) * 3 + 1] = c.g; col[(o + k) * 3 + 2] = c.b; } o += g.attributes.position.count; g.dispose(); }
    const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.BufferAttribute(pos, 3)); G.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); G.setAttribute('color', new THREE.BufferAttribute(col, 3));
    G.computeBoundingSphere(); return G;
  }
  let VC = null, GLASS = null;
  const mats = () => { if (!VC) { VC = new THREE.MeshLambertMaterial({ vertexColors: true }); GLASS = new THREE.MeshPhongMaterial({ color: 0xa8d8ff, transparent: true, opacity: 0.3, shininess: 140, specular: 0xffffff, depthWrite: false, side: THREE.DoubleSide }); } };
  // a moving thing past the fog not drawn, as the map's merged cells (js/render.js cullByDistance: world.cullFog): its sphere where it is now
  function fogOf(obj, r) { const p = { obj, geometry: { boundingSphere: { center: new THREE.Vector3(), radius: r } }, on: true, get visible() { return this.on; }, set visible(v) { this.on = v; obj.visible = v && !obj.userData.hide; } }; return p; }   // (userData.hide: kept hidden whatever the fog)
  function fogIn(p) { const W = typeof Render !== 'undefined' && Render.world; if (W && W.cullFog && !W.cullFog.includes(p)) W.cullFog.push(p); }

  /* ======================= the gondola for cars ======================= */
  const RED = 0xd23a2e, WHITE = 0xf2f2ee, STEEL = 0x8e959c, DARK = 0x3a3e44, CONC = 0xb9b5ad, DECKC = 0x8f8c88, YEL = 0xf2c12e, ROPE = 0x2c2e30;
  // TR: the tracks either side of the line (the cabins pass each other 1.2 m apart); RF: the rope over a cabin's floor; the cabin (CL long, CW wide,
  // CH high), its hanger (HG) up to the carriage on the rope; at the bottom the deck from D0 behind the dock's middle to D1 in front (DW: half
  // its width), RL its ramps; DL: a door's length (folded down it is a bridge onto the deck, at the top a ramp down to the ground); a tower's
  // column stands between the tracks (the cabins pass either side of it); vMax: the top speed half way (m/s); wait: s between two rides on their own
  const GD = { back: 16, TR: 2.4, RF: 6.38, CL: 7.6, CW: 3.6, CH: 3.3, HG: 3.1, D0: -7, D1: 5.5, RL: 11, DW: 5.8, DECK: 1.22, RW: 1.9, DL: 2.85, vMax: 10, wait: 14, door: 0.9, near: 60, still: 1 };
  let GO = null;   // (the gondola: its line, rope, stations, cabins; null until built)

  // (built by js/newmap.js hub4G: the stations and the cabins; the rope and its towers once every way of the map is laid, at init: a tower's
  // legs are put where no way runs)
  function gondola(MK, A0, B) {
    mats(); const H3 = MK.H3, gnd = (x, z) => H3.ground(x, z), T = GD;
    // (the bottom station GD.back m further down the line than the old one: off the hill's slope, on the flat meadow; the top one on the summit,
    // inside the hill's top loop: no deck there, the cabins stand on the summit, their doors fold down to the ground)
    const L0 = Math.hypot(B[0] - A0[0], B[1] - A0[1]), A = [A0[0] - (B[0] - A0[0]) / L0 * T.back, A0[1] - (B[1] - A0[1]) / L0 * T.back];
    const dx = B[0] - A[0], dz = B[1] - A[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, nx = -uz, nz = ux, hd = Math.atan2(dz, dx);
    const at = (P, sgn, a, c) => [P[0] + ux * sgn * a + nx * c, P[1] + uz * sgn * a + nz * c];
    // the bottom station: its deck just over the highest ground under it (no deck dug into the slope), the ramps' feet on the ground
    const SA = (() => { let gMax = -1e9, gMin = 1e9; for (let a = T.D0; a <= T.D1 + 1e-6; a += 1.25) for (let c = -T.DW; c <= T.DW + 1e-6; c += 1.45) { const g = gnd(...at(A, 1, a, c)); gMax = Math.max(gMax, g); gMin = Math.min(gMin, g); }
      const S = { x: A[0], z: A[1], sgn: 1, y0: gMax + 0.12 - T.DECK, gMin, foot: {}, drop: { [-T.TR]: 0, [T.TR]: 0 } }; S.top = S.y0 + T.DECK;
      for (const s2 of [-T.TR, T.TR]) S.foot[s2] = Math.min(S.top - 0.2, gnd(...at(A, 1, T.D0 - T.RL, s2)) + 0.02); return S; })();
    // the top station: the cabins' floor just over the highest ground under them; each door's drop to the ground where it lands
    const SB = (() => { let gMax = -1e9; for (const s2 of [-T.TR, T.TR]) for (let a = -T.CL / 2; a <= T.CL / 2 + 1e-6; a += 0.95) for (let c = -T.CW / 2; c <= T.CW / 2 + 1e-6; c += 0.9) gMax = Math.max(gMax, gnd(...at(B, -1, a, s2 + c)));
      const S = { x: B[0], z: B[1], sgn: -1, compact: true, top: gMax + 0.05, drop: {} }; S.y0 = S.top - T.DECK;
      for (const s2 of [-T.TR, T.TR]) { const tip = at(B, -1, -(T.CL / 2 + T.DL * 0.95), s2); S.drop[s2] = clamp(S.top - gnd(...tip), 0, T.DL * 0.45); } return S; })();
    const R = { A: { x: A[0], z: A[1], y: SA.y0, h: hd }, B: { x: B[0], z: B[1], y: SB.y0, h: hd }, L, ux, uz, nx, nz, hd, SA, SB, towers: [], posts: [], MK };
    const frame = (x, z, y, ry) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; MK.add(g); return g; }; R.frame = frame;
    const sign = (g, top, x, y, ry) => { const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 180; const c = cv.getContext('2d'); c.fillStyle = '#d23a2e'; c.fillRect(0, 0, 1024, 180); c.fillStyle = '#ffffff'; c.font = 'bold 110px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(top ? 'GONDOLA · TOP' : 'GONDOLA', 512, 96);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), side: THREE.DoubleSide })); m.position.set(x, y, 0); m.rotation.y = ry; g.add(m); };
    // the bottom station: a concrete deck level with the cabins' floor (down to the ground on its low side), a ramp up to each dock from behind,
    // low kerbs, red portal frames, a glass roof in a red frame (the car under it shows), glass walls along its sides, the bullwheels, a sign
    { const S = SA, g = frame(S.x, S.z, S.y0, -hd), sg = 1, K = kit(), dH = T.DECK + (S.y0 - S.gMin) + 0.4, mid = (T.D0 + T.D1) / 2, len = T.D1 - T.D0, HH = 10.6;
      K.box(len, dH, T.DW * 2, CONC, mid, T.DECK - dH / 2, 0); K.box(len - 0.1, 0.02, T.DW * 2 - 0.2, DECKC, mid, T.DECK + 0.005, 0);
      for (const s2 of [-T.TR, T.TR]) for (const o of [-1.45, 1.45]) K.box(len - 0.4, 0.02, 0.16, YEL, mid, T.DECK + 0.02, s2 + o);
      for (const s2 of [-T.TR, T.TR]) { const y1 = S.foot[s2] - S.y0, ang = Math.atan2(T.DECK - y1, T.RL), l = Math.hypot(T.RL, T.DECK - y1), am = T.D0 - T.RL / 2, ym = (T.DECK + y1) / 2, pos = [], idx = [], N = 8;
        for (let i = 0; i <= N; i++) { const a = T.D0 - T.RL * i / N, yt = T.DECK + (y1 - T.DECK) * i / N; for (const sd of [-1, 1]) { const c = s2 + sd * T.RW, gw = gnd(...at(A, 1, a, c)) - S.y0 - 0.3; pos.push(a, yt, c, a, Math.min(yt, gw), c); } }
        for (let i = 0; i < N; i++) { const q = i * 4; idx.push(q, q + 4, q + 2, q + 2, q + 4, q + 6, q, q + 1, q + 4, q + 1, q + 5, q + 4, q + 2, q + 6, q + 3, q + 3, q + 6, q + 7); }   // (its top and its two sides)
        const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); wg.setIndex(idx); wg.computeVertexNormals(); K.geo(wg, CONC);
        for (const o of [-T.RW + 0.1, T.RW - 0.1]) K.box(l, 0.22, 0.2, WHITE, am, ym + 0.1, s2 + o, 0, 0, ang); }
      for (const a of [T.D0, (T.D0 + T.D1) / 2 - 1, T.D1]) { for (const sd of [-1, 1]) K.box(0.5, HH - T.DECK, 0.5, RED, a, T.DECK + (HH - T.DECK) / 2, sd * (T.DW - 0.3)); K.box(0.6, 0.8, T.DW * 2, RED, a, HH, 0); }
      for (const sd of [-1, 1]) K.box(len + 1.2, 0.5, 0.35, RED, mid, HH + 0.2, sd * (T.DW + 0.4)); for (const a of [T.D0 - 0.6, T.D1 + 0.6]) K.box(0.35, 0.5, T.DW * 2 + 1.1, RED, a, HH + 0.2, 0);
      for (const s2 of [-T.TR, T.TR]) { K.torus(1.9, 0.16, DARK, T.D0 - 0.4, T.DECK + T.RF - 0.55, s2, Math.PI / 2, 0, 0, 24); K.box(1.2, 0.6, 1.2, DARK, T.D0 - 0.4, T.DECK + T.RF + 0.2, s2); }
      const m = K.mesh(VC); m.castShadow = true; m.receiveShadow = true; g.add(m);
      const GL = kit(); GL.box(len + 1.2, 0.08, T.DW * 2 + 0.8, 0xffffff, mid, HH + 0.5, 0); for (const sd of [-1, 1]) GL.box(len - 0.6, 5.0, 0.08, 0xffffff, mid, T.DECK + 2.6, sd * (T.DW - 0.3));
      const gl = GL.mesh(GLASS); gl.castShadow = false; gl.renderOrder = 3; g.add(gl); sign(g, false, T.D0 - 0.7, HH - 1.4, -Math.PI / 2);   // (the sign faces the ramps, where the cars come from)
      // the cars' asphalt (js/newmap.js surfGrid): the deck and the ramps
      const ex = Math.abs(T.D0 - T.RL) + T.DW + 2; (H3.paveFns = H3.paveFns || []).push({ bb: [S.x - ex, S.x + ex, S.z - ex, S.z + ex], inside: (x, z) => stLocal(S, x, z, (a, c) => a >= T.D0 - T.RL - 0.3 && a <= T.D1 + 0.3 && Math.abs(c) <= T.DW + 0.3) }); }
    // the top station: a red portal on the line's side of the docks (the ropes end at its beam, the sign on it), nothing on the summit's loop road;
    // the cabins stand on the summit
    { const S = SB, g = frame(S.x, S.z, S.y0, -hd), K = kit(), au = T.CL / 2 + 0.7, cw = T.TR + T.CW / 2 + 0.5, HH = T.DECK + T.RF + 0.9;
      for (const sd of [-1, 1]) { const p = at(B, -1, au, sd * cw), gl = gnd(...p) - S.y0; K.box(0.6, HH - gl + 0.3, 0.6, RED, -au, gl + (HH - gl + 0.3) / 2 - 0.3, sd * cw); R.posts.push({ x: p[0], z: p[1], h: hd, hl: 0.4, hw: 0.4 }); }
      K.box(0.8, 1.0, cw * 2 + 0.6, RED, -au, HH, 0); for (const s2 of [-T.TR, T.TR]) { K.box(1.2, 0.7, 1.4, DARK, -au, HH - 0.85, s2); K.cyl(0.5, 0.5, 0.5, DARK, -au + 0.3, HH - 0.6, s2, 0, 0, Math.PI / 2, 14); }
      const m = K.mesh(VC); m.castShadow = true; m.receiveShadow = true; g.add(m); sign(g, true, -au - 0.45, HH + 1.25, Math.PI / 2); }
    // the cabins: one opaque mesh (floor, posts, frames, hanger, carriage), one of glass (the bands along the sides, the roof), the two doors (fold down)
    const cabin = () => { const g = new THREE.Group(), K = kit(), C = T.CL / 2, W = T.CW / 2;
      K.box(T.CL, 0.28, T.CW, DARK, 0, 0.14, 0); K.box(T.CL - 0.3, 0.04, T.CW - 0.3, DECKC, 0, 0.3, 0);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.box(0.22, T.CH, 0.22, RED, sx * (C - 0.11), T.CH / 2, sz * (W - 0.11));
      for (const sz of [-1, 1]) { K.box(T.CL - 0.3, 0.75, 0.08, RED, 0, 0.66, sz * (W - 0.05)); for (const xx of [-T.CL / 6, T.CL / 6]) K.box(0.12, T.CH - 1.0, 0.1, WHITE, xx, 1.0 + (T.CH - 1.0) / 2, sz * (W - 0.05)); K.box(T.CL - 0.3, 0.12, 0.1, WHITE, 0, 1.06, sz * (W - 0.05)); }
      K.box(T.CL + 0.2, 0.18, 0.3, RED, 0, T.CH, W - 0.1); K.box(T.CL + 0.2, 0.18, 0.3, RED, 0, T.CH, -W + 0.1); K.box(0.3, 0.18, T.CW, RED, C - 0.1, T.CH, 0); K.box(0.3, 0.18, T.CW, RED, -C + 0.1, T.CH, 0); K.box(0.25, 0.16, T.CW, WHITE, 0, T.CH, 0);
      for (const sx of [-1, 1]) { K.rod([sx * 2.6, T.CH, -1.2], [sx * 0.9, T.CH + T.HG - 0.5, 0], 0.11, RED); K.rod([sx * 2.6, T.CH, 1.2], [sx * 0.9, T.CH + T.HG - 0.5, 0], 0.11, RED); }
      K.box(2.2, 0.22, 0.22, RED, 0, T.CH + T.HG - 0.5, 0); K.box(3.4, 0.5, 1.5, DARK, 0, T.CH + T.HG - 0.15, 0);
      for (const sx of [-1.2, -0.4, 0.4, 1.2]) for (const sz of [-0.55, 0.55]) K.cyl(0.24, 0.24, 0.16, STEEL, sx, T.CH + T.HG + 0.08, sz, Math.PI / 2, 0, 0, 12);
      const body = K.mesh(VC); body.castShadow = true; body.receiveShadow = true; g.add(body);
      const GL = kit(); for (const sz of [-1, 1]) GL.box(T.CL - 0.3, T.CH - 1.15, 0.05, 0xffffff, 0, 1.03 + (T.CH - 1.15) / 2, sz * (W - 0.05)); GL.box(T.CL - 0.5, 0.05, T.CW - 0.5, 0xffffff, 0, T.CH + 0.02, 0);
      const gl = GL.mesh(GLASS); gl.renderOrder = 3; g.add(gl);
      // a door: a red frame round a pale panel, hinged at the floor's edge; it folds down outwards (onto the deck, or at the top down to the ground)
      const door = (sx) => { const D = new THREE.Group(), Q = kit(), h = T.DL, w = T.CW - 0.5; Q.box(0.1, h, w, 0xc9dceb, 0, h / 2, 0); Q.box(0.14, 0.14, w + 0.1, RED, 0, h - 0.07, 0); Q.box(0.14, 0.14, w + 0.1, RED, 0, 0.07, 0);
        for (const sz of [-1, 1]) Q.box(0.14, h, 0.14, RED, 0, h / 2, sz * (w / 2)); Q.box(0.06, 0.1, w - 0.2, YEL, sx * 0.06, 0.42, 0); const m = Q.mesh(VC); m.castShadow = true; m.position.x = -sx * 0.06; D.add(m); D.position.set(sx * (C - 0.05), 0.33, 0); g.add(D); return D; };
      const db = door(-1), df = door(1); const sc = typeof Render !== 'undefined' && Render.scene; if (sc) sc.add(g);
      const fp = fogOf(g, 9); fogIn(fp); return { g, db, df, fp, open: { b: 0, f: 0 } }; };
    R.cab = { up: cabin(), dn: cabin() }; R.cab.up.s2 = -T.TR; R.cab.up.face = 1; R.cab.dn.s2 = T.TR; R.cab.dn.face = -1;
    // (until the rope is up, the stations' heights: js/newmap.js treesOut, the cabins stand at their docks)
    R.cy = (f) => (f < 0.5 ? SA.top : SB.top) + T.RF; GO = R; R.st = fresh(); pose(R.st); draw(1);
    return R;
  }
  // the rope and its towers (at init, every way laid): at the stations RF over the cabins' floor, in between at least 12.5 m over the ground under
  // both tracks, as a taut rope over the hill: straight spans between the towers (the upper hull of the heights needed, fewer towers where a straight
  // span stays within 2.2 m); a tower moved along the line to the nearest place where neither leg stands on a way (the rope there as high as both
  // spans need); the towers and ropes merged with the still meshes (js/nvbake.js, after this)
  function gondFinish() {
    const G = GO; if (!G || G.cyDone) return; G.cyDone = true; const MK = G.MK, H3 = MK.H3, gnd = (x, z) => H3.ground(x, z), T = GD, A = [G.SA.x, G.SA.z], B = [G.SB.x, G.SB.z], dx = B[0] - A[0], dz = B[1] - A[1], nx = G.nx, nz = G.nz;
    const P3 = (f, s2) => [A[0] + dx * f + nx * s2, A[1] + dz * f + nz * s2];
    const NF = 24, CLR = (f) => T.RF + (12.5 - T.RF) * sst(f / 0.14) * sst((1 - f) / 0.14), ya = G.SA.top + T.RF, yb = G.SB.top + T.RF, need = [];
    for (let k = 0; k <= NF; k++) { const f = k / NF; let gm = -1e9; for (const s2 of [-T.TR - 2, -T.TR + 2, T.TR - 2, T.TR + 2]) gm = Math.max(gm, gnd(...P3(f, s2)));
      need.push(k === 0 ? ya : k === NF ? yb : Math.max(ya + (yb - ya) * f, gm + CLR(f))); }
    const hull = [0]; for (let k = 1; k <= NF; k++) { hull.push(k); while (hull.length > 2) { const [i, j, m] = hull.slice(-3), s1 = (need[j] - need[i]) / (j - i), s2 = (need[m] - need[i]) / (m - i); if (s2 >= s1) hull.splice(-2, 1); else break; } }
    for (let ch = true; ch;) { ch = false; for (let q = 1; q < hull.length - 1; q++) { const i = hull[q - 1], j = hull[q + 1]; let ok = true; for (let k = i + 1; k < j; k++) if (need[i] + (need[j] - need[i]) * (k - i) / (j - i) < need[k] - 2.2) { ok = false; break; } if (ok) { hull.splice(q, 1); ch = true; break; } } }
    const H = need.slice(), clear = (k) => { const [x, z] = P3(k / NF, 0), q = MK.netGap(x, z, null, 1); return !q || q.d > 1.6; };
    for (let q = 1; q < hull.length - 1; q++) { const i = hull[q - 1], j = hull[q + 1], k0 = hull[q]; let best = null;
      for (let dk = 0; dk <= NF && best === null; dk++) for (const k of dk ? [k0 - dk, k0 + dk] : [k0]) { if (k <= i || k >= j || !clear(k)) continue; best = k; break; }
      if (best === null) continue; let h = need[best]; for (let m = i + 1; m < best; m++) h = Math.max(h, H[i] + (need[m] - H[i]) * (best - i) / (m - i)); for (let m = best + 1; m < j; m++) h = Math.max(h, H[j] + (need[m] - H[j]) * (j - best) / (j - m));
      hull[q] = best; H[best] = h; }
    for (const k of hull) need[k] = H[k];
    G.cy = (f) => { const k = clamp(f, 0, 1) * NF; for (let q = 0; q < hull.length - 1; q++) { const i = hull[q], j = hull[q + 1]; if (k <= j + 1e-9) return need[i] + (need[j] - need[i]) * (k - i) / (j - i); } return need[NF]; };
    G.hull = hull.map(k => k / NF); const cy = G.cy;
    { const K = kit(); for (const s2 of [-T.TR, T.TR]) for (let q = 0; q < hull.length - 1; q++) { const fa = hull[q] / NF - (q === 0 ? 0.04 : 0), fb = hull[q + 1] / NF + (q === hull.length - 2 ? 0.04 : 0);
        for (const o2 of [-0.55, 0.55]) { const [ax, az] = P3(fa, s2 + o2), [bx, bz] = P3(fb, s2 + o2); K.rod([ax, cy(fa), az], [bx, cy(fb), bz], 0.06, ROPE); }
        { const [ax, az] = P3(fa, s2), [bx, bz] = P3(fb, s2); K.rod([ax, cy(fa) - 0.55, az], [bx, cy(fb) - 0.55, bz], 0.035, ROPE); } }
      const m = K.mesh(VC); m.castShadow = false; m.receiveShadow = false; MK.add(m); }
    for (const k of hull.slice(1, -1)) { const f = k / NF, [x, z] = P3(f, 0), g0 = gnd(x, z) - 0.2, top = cy(f) - 0.25, Ht = top - g0, K = kit(), w = T.TR + 1.2;
      K.box(0.8, Ht + 0.2, 0.8, STEEL, 0, Ht / 2 - 0.1, 0); K.box(1.6, 0.5, 1.6, CONC, 0, 0.25, 0);
      for (const sd of [-1, 1]) K.rod([0, Ht - 6, 0], [0, Ht - 0.9, sd * (w - 0.3)], 0.14, STEEL);
      K.box(1.2, 1.0, w * 2, RED, 0, Ht - 0.45, 0); for (const s2 of [-T.TR, T.TR]) for (const o2 of [-0.55, 0.55]) K.box(2.2, 0.35, 0.3, DARK, 0, Ht + 0.12, s2 + o2);
      const g = G.frame(x, z, g0, -G.hd), m = K.mesh(VC); m.castShadow = true; m.receiveShadow = true; g.add(m); G.towers.push({ x, z, f }); G.posts.push({ x, z, h: G.hd, hl: 0.55, hw: 0.55 }); }
    if (MK.clearWorld) MK.clearWorld((x, z) => G.towers.some(t => Math.hypot(x - t.x, z - t.z) < 4), -99);   // (no tree in a tower)
    pose(G.st); draw(1);
  }
  // (the trees out of the stations: js/newmap.js treesOut)
  function gondArea(x, z) { const G = GO; if (!G) return false; if (stLocal(G.SA, x, z, (a, c) => a >= GD.D0 - GD.RL - 2.5 && a <= GD.D1 + 2.5 && Math.abs(c) <= GD.DW + 2.5)) return true;
    return !!stLocal(G.SB, x, z, (a, c) => Math.abs(a) <= GD.CL / 2 + GD.DL + 1.5 && Math.abs(c) <= GD.TR + GD.CW / 2 + 2); }
  // (x, z) in a station's own frame: along its deck (its D0 .. D1 the deck, behind D0 the ramps) and across (+ to the line's left); f(a, c)
  function stLocal(S, x, z, f) { const G = GO, dx = x - S.x, dz = z - S.z; return f(S.sgn * (dx * G.ux + dz * G.uz), -dx * G.uz + dz * G.ux); }
  // the state: f the up cabin's place along the line (0 at the bottom station, 1 at the top; the down cabin at 1 - f), the doors (0 shut, 1 down)
  function fresh() { return { f: 0, mode: 'dock', t: 0, dir: 1, ride: null, carry: null, still: 0, away: 0, cin: null, prev: null, seat: null, wait: 0, rides: 0, arm: true }; }   // (arm: the car may set a cabin off; after a ride only once it has driven or left the cabin)
  // a cabin's place: its middle on the ground plan, its floor's height, its heading (the up cabin faces uphill, the down one downhill)
  function cabPose(c, f) { const G = GO, fc = c.face > 0 ? f : 1 - f, x = G.SA.x + (G.SB.x - G.SA.x) * fc + G.nx * c.s2, z = G.SA.z + (G.SB.z - G.SA.z) * fc + G.nz * c.s2, fl = G.cy(fc) - GD.RF;
    return { x, z, y: fl - 0.32, fl, psi: c.face > 0 ? G.hd : wrap(G.hd + Math.PI), fc }; }
  function pose(S) { for (const k of ['up', 'dn']) GO.cab[k].p = cabPose(GO.cab[k], S.f); }
  // which door of a cabin faces a station's ramps when it stands there: the back one at the station it leaves from, the front one at the other;
  // how far down it folds there (at the top down to the ground: past level by its drop)
  const doorAt = (c) => (c.p.fc < 0.5) === (c.face > 0) ? 'b' : 'f';
  const dropAt = (c) => { const S = c.p.fc < 0.5 ? GO.SA : GO.SB; return S.drop[c.s2] || 0; };
  // (x, z) in a cabin's frame: u along it (+ its front), v across
  const cloc = (c, x, z) => { const p = c.p, co = Math.cos(p.psi), si = Math.sin(p.psi), dx = x - p.x, dz = z - p.z; return [dx * co + dz * si, -dx * si + dz * co]; };
  const cwld = (c, u, v) => { const p = c.p, co = Math.cos(p.psi), si = Math.sin(p.psi); return [p.x + u * co - v * si, p.z + u * si + v * co]; };

  // the ground the car stands on at (x, z) by its height y: a cabin's floor, its door down to the ground at the top, the bottom station's deck or ramps
  // (null: none of them there)
  function gondGround(x, z, y) {
    const G = GO; if (!G) return null;
    for (const k of ['up', 'dn']) { const c = G.cab[k], p = c.p; if (Math.abs(x - p.x) > 8 || Math.abs(z - p.z) > 8) continue; if (y != null && y < p.fl - 0.6 - GD.DL * 0.45) continue;
      const [u, v] = cloc(c, x, z); if (Math.abs(v) > GD.CW / 2) continue;
      if (Math.abs(u) <= GD.CL / 2) { if (!(y != null && y < p.fl - 0.6)) return p.fl; continue; }
      const e = u < 0 ? 'b' : 'f', dr = dropAt(c), t = (Math.abs(u) - GD.CL / 2) / GD.DL; if (dr > 0.02 && c.open[e] > 0.97 && e === doorAt(c) && t <= 1 && Math.abs(v) <= GD.CW / 2 - 0.25) { const h = p.fl - dr * t; if (!(y != null && y < h - 0.6)) return h; } }
    const S = G.SA; if (Math.abs(x - S.x) > 26 || Math.abs(z - S.z) > 26) return null;
    const h = stLocal(S, x, z, (a, c) => { if (a >= GD.D0 && a <= GD.D1 && Math.abs(c) <= GD.DW) return S.top;
      if (a < GD.D0 && a >= GD.D0 - GD.RL) for (const s2 of [-GD.TR, GD.TR]) if (Math.abs(c - s2) <= GD.RW) return lerp(S.foot[s2], S.top, (a - (GD.D0 - GD.RL)) / GD.RL); return null; });
    return h != null && !(y != null && y < h - 0.6) ? h : null;
  }
  // the walls at (x, z) for a car at height y: a cabin's sides and shut doors (the car inside kept in, one outside kept out), the bottom station's deck
  // and its ramps' high sides from below, its glass walls on the deck; the top station's posts and the towers' legs; out [nx, nz, depth] (the way back)
  function gondWall(x, z, y, out) {
    const G = GO; if (!G) return false;
    for (const k of ['up', 'dn']) { const c = G.cab[k], p = c.p; if (Math.abs(x - p.x) > 6 || Math.abs(z - p.z) > 6) continue; if (y < p.fl - 0.9 - dropAt(c) || y > p.fl + GD.CH) continue;
      const [u, v] = cloc(c, x, z), hu = GD.CL / 2, hv = GD.CW / 2; if (Math.abs(u) > hu + 0.3 || Math.abs(v) > hv + 0.3) continue;
      const co = Math.cos(p.psi), si = Math.sin(p.psi), end = u < 0 ? 'b' : 'f', openE = c.open[end] > 0.97, door = Math.abs(v) < hv - 0.3;
      let d = 0, nx = 0, nz = 0;
      if (G.st.cin === k) {   // (the car inside: back in)
        if (Math.abs(v) > hv - 0.18) { d = Math.abs(v) - (hv - 0.18); const sv = v < 0 ? 1 : -1; nx = -si * sv; nz = co * sv; }
        else if (Math.abs(u) > hu - 0.15 && !(openE && door)) { d = Math.abs(u) - (hu - 0.15); const su = u < 0 ? 1 : -1; nx = co * su; nz = si * su; }
      } else if (!(openE && door) && Math.abs(u) < hu + 0.25 && Math.abs(v) < hv + 0.25) {   // (outside: out by the nearest side)
        const dS = hv + 0.25 - Math.abs(v), dE = hu + 0.25 - Math.abs(u);
        if (dS < dE) { d = dS; const sv = v < 0 ? -1 : 1; nx = -si * sv; nz = co * sv; } else { d = dE; const su = u < 0 ? -1 : 1; nx = co * su; nz = si * su; }
      }
      if (d > 0) { out[0] = nx; out[1] = nz; out[2] = d; return true; } }
    for (const m of G.posts) { if (Math.abs(x - m.x) > 2 || Math.abs(z - m.z) > 2) continue; const dx = x - m.x, dz = z - m.z, r = Math.hypot(dx, dz), R = Math.max(m.hl, m.hw); if (r >= R || r < 1e-6) continue; out[0] = dx / r; out[1] = dz / r; out[2] = R - r; return true; }
    const S = G.SA; if (Math.abs(x - S.x) > 26 || Math.abs(z - S.z) > 26) return false;
    const r = stLocal(S, x, z, (a, c) => { const sx = G.ux, sz = G.uz, lx = -G.uz, lz = G.ux; let d = 0, ax = 0, az = 0;
      if (y < S.top - 0.6) {   // (below the deck: its box and the ramps' sides are walls)
        if (a >= GD.D0 && a <= GD.D1 + 0.3 && Math.abs(c) <= GD.DW + 0.3) { const dB = a - GD.D0 + 0.3, dF = GD.D1 + 0.3 - a, dS = GD.DW + 0.3 - Math.abs(c); d = Math.min(dB, dF, dS);
          if (d === dS) { const s = c < 0 ? -1 : 1; ax = lx * s; az = lz * s; } else if (d === dB) { ax = -sx; az = -sz; } else { ax = sx; az = sz; } }
        else if (a < GD.D0 && a >= GD.D0 - GD.RL) for (const s2 of [-GD.TR, GD.TR]) { if (G.st.ramp === s2) continue; const e = Math.abs(c - s2); if (e > GD.RW + 0.25) continue; const h = lerp(S.foot[s2], S.top, (a - (GD.D0 - GD.RL)) / GD.RL); if (h < y + 0.6) continue;
          d = GD.RW + 0.25 - e; const s = c - s2 < 0 ? -1 : 1; ax = lx * s; az = lz * s; break; } }
      else if (a >= GD.D0 && a <= GD.D1 && Math.abs(c) > GD.DW - 0.45 && Math.abs(c) < GD.DW + 0.2) { d = Math.abs(c) - (GD.DW - 0.45); const s = c < 0 ? 1 : -1; ax = lx * s; az = lz * s; }   // (the glass walls on the deck)
      return d > 0 ? [ax, az, d] : null; });
    if (r) { out[0] = r[0]; out[1] = r[1]; out[2] = r[2]; return true; }
    return false;
  }

  // ---- each step of the race: the cabins ride, the car in one with them ----
  function gondStep(dt, P) {
    const G = GO; if (!G || !P) return; const S = G.st, c0 = G.cab;
    S.prev = { f: S.f, cx: P.x, cz: P.z, ch: P.h };
    // the ramp the car's middle is on (its sides are no wall for it)
    S.ramp = null; { const St = G.SA; if (Math.abs(P.x - St.x) < 26 && Math.abs(P.z - St.z) < 26) S.ramp = stLocal(St, P.x, P.z, (a, c) => { if (a >= GD.D0 || a < GD.D0 - GD.RL - 0.5) return null; for (const s2 of [-GD.TR, GD.TR]) if (Math.abs(c - s2) <= GD.RW + 0.1 && (P.y || 0) > lerp(St.foot[s2], St.top, (a - (GD.D0 - GD.RL)) / GD.RL) - 0.7) return s2; return null; }); }
    // the car in a cabin: its middle inside the cabin's floor (by its height)
    let cin = null; for (const k of ['up', 'dn']) { const c = c0[k], [u, v] = cloc(c, P.x, P.z); if (Math.abs(u) < GD.CL / 2 && Math.abs(v) < GD.CW / 2 && (P.y || 0) > c.p.fl - 0.5 && (P.y || 0) < c.p.fl + 1.5) cin = k; }
    if (!S.carry) S.cin = cin;
    const sp = Math.hypot(P.vx || 0, P.vz || 0), dStA = Math.hypot(P.x - G.SA.x, P.z - G.SA.z), dStB = Math.hypot(P.x - G.SB.x, P.z - G.SB.z), near = Math.min(dStA, dStB) < GD.near;
    const towards = (c, end, to, rate) => { c.open[end] += clamp(to - c.open[end], -rate * dt, rate * dt); };
    if (S.mode === 'dock') {   // standing at the stations, the doors to the ramps down; the car inside and still a moment: off it goes
      for (const k of ['up', 'dn']) { const c = c0[k], e = doorAt(c); towards(c, e, 1, 1 / GD.door); towards(c, e === 'b' ? 'f' : 'b', 0, 1 / GD.door); }
      let inside = false; if (cin) { const c = c0[cin], hu = GD.CL / 2 - 0.1, hv = GD.CW / 2 - 0.1, co = Math.cos(P.h), si = Math.sin(P.h); inside = true;
        for (const [a, b] of P.corners || []) { const [u, v] = cloc(c, P.x + a * co - b * si, P.z + a * si + b * co); if (Math.abs(u) > hu || Math.abs(v) > hv) { inside = false; break; } } }
      if (!cin || sp > 1.5) S.arm = true; S.still = inside && sp < 0.6 && S.arm ? S.still + dt : 0; S.wait += dt;
      if (S.still > GD.still) { S.mode = 'shut'; S.t = 0; S.carry = cin; S.cin = cin; const c = c0[cin], [u, v] = cloc(c, P.x, P.z); S.seat = { u, v, dh: wrap(P.h - c.p.psi) }; }
      else if (!cin && !near && S.wait > GD.wait && Math.min(dStA, dStB) < 420) { S.mode = 'shut'; S.t = 0; S.carry = null; }
    } else if (S.mode === 'shut') {   // the doors up, then away
      let shut = true; for (const k of ['up', 'dn']) for (const e of ['b', 'f']) { towards(c0[k], e, 0, 1 / GD.door); if (c0[k].open[e] > 0.001) shut = false; }
      if (shut) { S.mode = 'ride'; S.t = 0; S.dir = S.f < 0.5 ? 1 : -1; S.f0 = S.f; S.T = 1.875 * GO.L / GD.vMax; }   // (eased: its top speed half way 1.875 times the mean)
    } else if (S.mode === 'ride') {   // eased along the rope; both cabins at once
      S.t += dt; const k = clamp(S.t / S.T, 0, 1), e = k * k * k * (k * (k * 6 - 15) + 10); S.f = S.dir > 0 ? e : 1 - e;
      if (k >= 1) { S.f = S.dir > 0 ? 1 : 0; S.mode = 'opening'; S.t = 0; S.rides++; }
    } else if (S.mode === 'opening') {   // at the stations: the doors to the ramps down, then the car may drive out
      let open = true; for (const k of ['up', 'dn']) { const c = c0[k], e = doorAt(c); towards(c, e, 1, 1 / GD.door); if (c.open[e] < 0.97) open = false; }
      if (open) { S.mode = 'dock'; S.carry = null; S.wait = 0; S.still = 0; S.arm = false; }
    }
    pose(S);
    if (S.carry) seatCar(P, c0[S.carry]);
    if (S.carry || S.cin) P.stuckT = 0;
  }
  // the car on its place in the cabin (as it stood when the door shut), moved with it; no gas, brake or steering while it rides
  function seatCar(P, c) {
    const s = GO.st.seat; if (!s) return; const [x, z] = cwld(c, s.u, s.v);
    P.x = x; P.z = z; P.h = wrap(c.p.psi + s.dh); P.vx = P.vz = 0; P.w = 0; if (P.nvA) P.nvA = 0;
    P.inThr = 0; P.inBrk = 0; P.inSteer = 0; P.steer = 0; P.inHand = 0;
  }
  // after the cars moved: the car kept where it rides, drawn moving smoothly (its last place for the frames between the steps)
  function gondPost(P) { const G = GO; if (!G || !P) return; const S = G.st; if (S.carry || S.cin) P.stuckT = 0; if (!S.carry || !S.prev) return; P.px = S.prev.cx; P.pz = S.prev.cz; P.ph = S.prev.ch; }
  // ---- every frame: the cabins where they are between the steps, the doors (down past level at the top, onto the ground) ----
  function draw(alpha) {
    const G = GO; if (!G) return; const S = G.st, f = S.prev ? lerp(S.prev.f, S.f, clamp(alpha, 0, 1)) : S.f;
    for (const k of ['up', 'dn']) { const c = G.cab[k], p = cabPose(c, f); c.g.position.set(p.x, p.y, p.z); c.g.rotation.set(0, -p.psi, 0);
      const th = Math.PI / 2 + Math.asin(clamp(dropAt(c) / GD.DL, 0, 0.45)); c.db.rotation.z = sst(c.open.b) * th; c.df.rotation.z = -sst(c.open.f) * th;
      c.fp.geometry.boundingSphere.center.set(p.x, p.y + 4, p.z); }
  }

  /* ======================= the volcano train ======================= */
  // (js/nvpark.js builds the track round the volcano, the station and the train; here it runs.) The car stops in the yellow box on the
  // platform: it glides onto the wagon, the train goes once round the volcano (through the tunnel under its flank) and back, the car glides
  // back onto the platform and drives on (down the ramp at either end). Nobody riding and the car away, the train goes round on its own.
  const VTK = { vMax: 11, acc: 2.2, board: 1.2, still: 0.8, wait: 20, near: 45, far: 320, maxLen: 6.4 };
  let VT = null;
  function trainFresh() { return { s: 0, mode: 'dock', t: 0, v: 0, carry: false, still: 0, wait: 0, laps: 0, rides: 0, prev: null, seat: null, from: null, arm: true, ramp: null }; }
  function trainInit() {
    const B = typeof NVPark !== 'undefined' && NVPark.built, v = B && B.vtrain; if (!v) { VT = null; return; }
    if (VT !== v) { VT = v; VT.fpL = fogOf(v.loco, 6); VT.fpW = fogOf(v.wagon, 6); }
    fogIn(VT.fpL); fogIn(VT.fpW); VT.S = trainFresh(); trainDraw(1);
  }
  // the station's frame: along its platform (+ the way the train leaves) and across (+ towards the track)
  const sloc = (x, z) => { const t = VT.st, c = Math.cos(t.hd), s = Math.sin(t.hd), dx = x - t.x, dz = z - t.z; return [dx * c + dz * s, -dx * s + dz * c]; };
  const swld = (a, b) => { const t = VT.st, c = Math.cos(t.hd), s = Math.sin(t.hd); return [t.x + a * c - b * s, t.z + a * s + b * c]; };
  // the wagon's place (s: metres it has gone from the station, the loco 8.2 m ahead), its deck's height and its heading
  function wagonAt(s) { const u = VT.uSt + s / VT.L2, uu = ((u % 1) + 1) % 1, p = VT.tc.getPointAt(uu), t = VT.tc.getTangentAt(uu); return { x: p.x, z: p.z, y: p.y + 0.05, deck: p.y + 0.05 + 1.23, psi: Math.atan2(t.z, t.x), u: uu }; }
  // the platform's and its ramps' height at (x, z) (null: not on them)
  function platAt(x, z) { const t = VT.st, [a, b] = sloc(x, z); if (Math.abs(b) > t.hw) return null; if (a >= t.x0 && a <= t.x1) return t.top;
    for (const R of t.ramps) { const lo = Math.min(R.a, R.b), hi = Math.max(R.a, R.b); if (a >= lo && a <= hi) return lerp(t.top, R.y1, (a - R.a) / (R.b - R.a)); } return null; }
  function trainGround(x, z, y) {
    if (!VT) return null; const t = VT.st, S = VT.S;
    if (S.carry) { const w = S.wp;   // (the car on the wagon: its deck, whatever the car's height; gliding on or off at the station: the platform's box, the gap and the wagon level)
      if (S.mode === 'go') { if (w && Math.abs(x - w.x) < 6 && Math.abs(z - w.z) < 6) { const c = Math.cos(w.psi), si = Math.sin(w.psi), dx = x - w.x, dz = z - w.z, u = dx * c + dz * si, v = -dx * si + dz * c; if (Math.abs(u) <= 4.2 && Math.abs(v) <= 2) return w.deck; } }
      else { const [a, b] = sloc(x, z); if (a > -4.6 && a < 4.6 && b > -2.2 && b < t.wagonZ + 1.8) return t.top; } }
    if (Math.abs(x - t.x) > 24 || Math.abs(z - t.z) > 24) return null;
    const h = platAt(x, z); if (h != null && !(y != null && y < h - 0.6)) return h; return null;
  }
  function trainWall(x, z, y, out) {
    if (!VT) return false; const t = VT.st, S = VT.S;
    // the train itself, moving or standing (not while the car rides it)
    if (!S.carry && S.mode !== 'board' && S.mode !== 'unboard') for (const [w, hl, hw] of [[S.wp, 3.7, 1.5], [S.lp, 3.1, 1.4]]) { if (!w || Math.abs(x - w.x) > 6 || Math.abs(z - w.z) > 6 || y > w.y + 3.5) continue;
      const c = Math.cos(w.psi), si = Math.sin(w.psi), dx = x - w.x, dz = z - w.z, u = dx * c + dz * si, v = -dx * si + dz * c; if (Math.abs(u) >= hl || Math.abs(v) >= hw) continue;
      const dS = hw - Math.abs(v), dE = hl - Math.abs(u); if (dS < dE) { const sv = v < 0 ? -1 : 1; out[0] = -si * sv; out[1] = c * sv; out[2] = dS; } else { const su = u < 0 ? -1 : 1; out[0] = c * su; out[1] = si * su; out[2] = dE; } return true; }
    if (Math.abs(x - t.x) > 24 || Math.abs(z - t.z) > 24) return false;
    const [a, b] = sloc(x, z), c = Math.cos(t.hd), si = Math.sin(t.hd); let d = 0, nx = 0, nz = 0;
    if (y < t.top - 0.6) {   // (below the platform: its box and its ramps' high sides are walls)
      if (a >= t.x0 && a <= t.x1 && Math.abs(b) <= t.hw + 0.25) { const dS = t.hw + 0.25 - Math.abs(b), dA = Math.min(a - t.x0, t.x1 - a); if (dS <= dA) { d = dS; const sv = b < 0 ? -1 : 1; nx = -si * sv; nz = c * sv; } else { d = dA; const su = a - t.x0 < t.x1 - a ? -1 : 1; nx = c * su; nz = si * su; } }
      else if (S.ramp == null) for (const [k, R] of t.ramps.entries()) { const lo = Math.min(R.a, R.b), hi = Math.max(R.a, R.b); if (a < lo || a > hi || Math.abs(b) > t.hw + 0.25) continue; if (lerp(t.top, R.y1, (a - R.a) / (R.b - R.a)) < y + 0.6) continue;
        d = t.hw + 0.25 - Math.abs(b); const sv = b < 0 ? -1 : 1; nx = -si * sv; nz = c * sv; break; } }
    else if (a >= t.x0 - 0.3 && a <= t.x1 + 0.3 && Math.abs(b) > t.hw - 0.22 && Math.abs(b) < t.hw + 0.4) { d = Math.abs(b) - (t.hw - 0.22); const sv = b < 0 ? 1 : -1; nx = -si * sv; nz = c * sv; }   // (on the platform: its edges, the rail outside and the train's side)
    if (d > 0) { out[0] = nx; out[1] = nz; out[2] = d; return true; } return false;
  }
  function trainStep(dt, P) {
    if (!VT || !P) return; const S = VT.S, t = VT.st;
    S.prev = { s: S.s, cx: P.x, cz: P.z, ch: P.h, cy: P.y };
    const sp = Math.hypot(P.vx || 0, P.vz || 0), dSt = Math.hypot(P.x - t.x, P.z - t.z);
    S.ramp = null; if (dSt < 26) { const [a, b] = sloc(P.x, P.z); if (Math.abs(b) <= t.hw + 0.1 && (a < t.x0 || a > t.x1)) for (const [k, R] of t.ramps.entries()) { const lo = Math.min(R.a, R.b), hi = Math.max(R.a, R.b); if (a >= lo - 0.5 && a <= hi && (P.y || 0) > lerp(t.top, R.y1, clamp((a - R.a) / (R.b - R.a), 0, 1)) - 0.7) S.ramp = k; } }
    if (S.mode === 'dock') {   // at the station: the car in the yellow box, still a moment: aboard
      const [a, b] = sloc(P.x, P.z), inBox = a > t.box[0] && a < t.box[1] && Math.abs(b) < t.hw && Math.abs((P.y || 0) - t.top) < 0.5 && (P.m ? P.m.len <= VTK.maxLen : true);
      if (!inBox || sp > 1.5) S.arm = true; S.still = inBox && sp < 0.5 && S.arm ? S.still + dt : 0; S.wait += dt;
      if (S.still > VTK.still) { S.mode = 'board'; S.t = 0; const back = Math.cos(wrap(P.h - t.hd)) < 0; S.from = { x: P.x, z: P.z, h: P.h }; S.seat = { dh: back ? Math.PI : 0 }; S.carry = true; }
      else if (dSt > VTK.near && dSt < VTK.far && S.wait > VTK.wait) { S.mode = 'go'; S.t = 0; S.v = 0; S.s0 = S.s; }
    } else if (S.mode === 'board') {   // onto the wagon (1.2 s), then off it goes
      S.t += dt; if (S.t >= VTK.board) { S.mode = 'go'; S.t = 0; S.v = 0; S.s0 = S.s; }
    } else if (S.mode === 'go') {   // once round: speeding up, on, slowing down to stop at the station again
      const left = S.s0 + VT.L2 - S.s, vb = Math.sqrt(Math.max(0, 2 * VTK.acc * left)); S.v = Math.min(VTK.vMax, S.v + VTK.acc * dt, vb + 0.3);
      S.s += S.v * dt; if (S.s >= S.s0 + VT.L2 - 0.01) { S.s = 0; S.v = 0; S.laps++; if (S.carry) { S.mode = 'unboard'; S.t = 0; S.rides++; } else { S.mode = 'dock'; S.wait = 0; } }
    } else if (S.mode === 'unboard') {   // back onto the platform's box, then free
      S.t += dt; if (S.t >= VTK.board) { S.mode = 'dock'; S.carry = false; S.wait = 0; S.still = 0; S.arm = false; }
    }
    S.wp = wagonAt(S.s); S.lp = wagonAt(S.s + VT.gap);
    if (S.carry) trainSeat(P);
    if (S.carry || (dSt < 24 && platAt(P.x, P.z) != null)) P.stuckT = 0;
  }
  // the car on the wagon (in its middle, along it): glided there from the platform's box and back
  function trainSeat(P) {
    const S = VT.S, w = S.wp, h = wrap(w.psi + S.seat.dh); let x = w.x, z = w.z, hh = h;
    if (S.mode === 'board' || S.mode === 'unboard') { const k = sst(S.t / VTK.board), f = S.from, [bx, bz] = swld(0, 0), k2 = S.mode === 'board' ? k : 1 - k;
      const fx = S.mode === 'board' ? f.x : bx, fz = S.mode === 'board' ? f.z : bz, fh = S.mode === 'board' ? f.h : h; x = lerp(fx, w.x, k2); z = lerp(fz, w.z, k2); hh = fh + wrap(h - fh) * k2; }
    P.x = x; P.z = z; P.h = hh; P.vx = P.vz = 0; P.w = 0; if (P.nvA) P.nvA = 0;
    P.inThr = 0; P.inBrk = 0; P.inSteer = 0; P.steer = 0; P.inHand = 0;
  }
  function trainPost(P) { if (!VT || !P) return; const S = VT.S; if (S.carry) P.stuckT = 0; if (!S.carry || !S.prev) return; P.px = S.prev.cx; P.pz = S.prev.cz; P.ph = S.prev.ch; }
  function trainDraw(alpha) {
    if (!VT) return; const S = VT.S, s = S.prev ? lerp(S.prev.s > S.s + 1 ? S.prev.s - VT.L2 : S.prev.s, S.s, clamp(alpha, 0, 1)) : S.s;
    for (const [g, sp, fp] of [[VT.wagon, s, VT.fpW], [VT.loco, s + VT.gap, VT.fpL]]) { const w = wagonAt(sp); g.position.set(w.x, w.y, w.z); g.rotation.set(0, -w.psi, 0); fp.geometry.boundingSphere.center.set(w.x, w.y + 2, w.z); }
  }

  /* ======================= the fire engine ======================= */
  // The fire engine C · Avtolestev (the user's choice, js/missions/kit.js MisKit.fireTruck: its model) parked at the rescue base beside the
  // ambulances, its place marked; beside it a red bay: the car stopped in it, a card at the top: DRIVE THE FIRE ENGINE. Your car stays in
  // the bay and you drive the fire engine (the racing truck's physics with its own limiter, as in the missions; its blue lamps flash).
  // Back in its place, stopped: BACK TO YOUR CAR (the fire engine stays there, you are in your car in the bay). A restart at HOME: your car.
  const FE = { home: { x: -42.5, z: 79.5, h: Math.PI / 2 }, bay: { x: -49.5, z: 79.5, h: Math.PI / 2 }, hb: [1.9, 3.4], hh: [1.9, 5.0], vMin: 2.2 };
  let FT = null;
  const feModel = () => (typeof MisKit !== 'undefined' ? MisKit.truckModel('titan', { vLim: 105, kw: 560, len: 8.4 }) : null);
  // the car's model and what goes with it (js/core.js Car: its grip, turn, mass, size, contact circles), put on the player's car or back
  const MKEYS = ['m', 'name', 'arc', 'tracG', 'brakeG', 'aeroK', 'aeroK0', 'upg', 'upgGrip', 'I', 'tw', 'corners', 'circles', 'rad', 'wreck'];
  function takeModel(P) { const o = {}; for (const k of MKEYS) o[k] = P[k]; return o; }
  function putModel(P, o) { for (const k of MKEYS) { if (o[k] === undefined) delete P[k]; else P[k] = o[k]; } P.gear = 1; P.rpm = P.m.idle; P.shiftT = 0; }
  function asModel(P, M) { const c = new Core.Car(M, { isPlayer: true, phys: P.phys, assist: Math.max(0, Core.ASSISTS.indexOf(P.assist)), color: P.color }), o = {}; for (const k of MKEYS) o[k] = c[k]; o.name = M.name; return o; }
  // the parts of the car's view the fire engine hides (its body and what is on it, its wheels, the marker), and puts back
  const viewParts = (v, keep) => [].concat(v.bodyG ? v.bodyG.children.filter(o => o !== keep) : [], v.wf || [], v.wr || [], v.wm || [], v.marker ? [v.marker] : []);
  function feBuild(P) {
    const R = typeof Render !== 'undefined' ? Render : null, v = R && R.viewOf ? R.viewOf(P) : null, M = feModel(); if (!v || !M || typeof MisKit === 'undefined') return null;
    const vis = viewParts(v, null).map(o => [o, o.visible]), lights = (v.lights || []).map(L => L.clone()), run = { P, props: [], add(o) { this.props.push(o); return o; } };
    let T = null; try { T = MisKit.fireTruck(run); } catch (e) { T = null; }
    for (const [o, w] of vis) o.visible = w; (v.lights || []).forEach((L, i) => L.copy(lights[i]));
    if (!T || !T.g) return null;
    if (T.g.parent) T.g.parent.remove(T.g); T.step(0, false); const hold = new THREE.Group(); R.scene.add(hold);
    // (parked: its parts as one mesh, one draw call; its own parts only on the car while it is driven)
    { T.g.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(T.g.matrixWorld).invert(), L = [];
      T.g.traverse(o => { if (!o.isMesh) return; const m = Array.isArray(o.material) ? o.material[0] : o.material, ge = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); ge.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
        if (!ge.attributes.color) { const c = m.color || new THREE.Color(1, 1, 1), n = ge.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; } ge.setAttribute('color', new THREE.BufferAttribute(a, 3)); }
        L.push(ge); });
      let n = 0; for (const ge of L) n += ge.attributes.position.count; const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3); let o = 0;
      for (const ge of L) { if (!ge.attributes.normal) ge.computeVertexNormals(); pos.set(ge.attributes.position.array, o * 3); nor.set(ge.attributes.normal.array, o * 3); col.set(ge.attributes.color.array.length === ge.attributes.position.count * 3 ? ge.attributes.color.array : new Float32Array(ge.attributes.position.count * 3).fill(1), o * 3); o += ge.attributes.position.count; ge.dispose(); }
      const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.BufferAttribute(pos, 3)); G.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); G.setAttribute('color', new THREE.BufferAttribute(col, 3)); G.computeBoundingSphere();
      mats(); const pm = new THREE.Mesh(G, VC); pm.castShadow = true; pm.receiveShadow = true; hold.add(pm); }
    const B = typeof NVBase !== 'undefined' && NVBase.built, y0 = B && B.y0 != null ? B.y0 : (H3 && H3.ground ? H3.ground(FE.home.x, FE.home.z) : 0);
    const F = { T, hold, y0, M, mode: 'park', pick: null, car: null, copy: null, fp: fogOf(hold, 7), seen: 0 }; fogIn(F.fp);
    F.place = (p) => { hold.position.set(p.x, y0 + 0.02, p.z); hold.rotation.set(0, -p.h, 0); F.fp.geometry.boundingSphere.center.set(p.x, y0 + 2, p.z); }; F.place(FE.home);
    marks(F); return F;
  }
  // the marks on the base's asphalt: the red bay with FIRE ENGINE, the fire engine's place (yellow and black)
  function marks(F) {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 512; const c = cv.getContext('2d'), sx = 512 / 12, x0 = -52, z0 = 74.5;
    const X = (x) => (x - x0) * sx, Z = (z) => (z - z0) * sx; c.clearRect(0, 0, 512, 512);
    c.strokeStyle = '#d8282a'; c.lineWidth = 7; c.strokeRect(X(FE.bay.x - FE.hb[0]), Z(FE.bay.z - FE.hb[1]), FE.hb[0] * 2 * sx, FE.hb[1] * 2 * sx);
    c.save(); c.translate(X(FE.bay.x), Z(FE.bay.z)); c.rotate(Math.PI / 2); c.fillStyle = '#d8282a'; c.font = 'bold 34px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('FIRE ENGINE', 0, 0); c.restore();
    c.save(); c.beginPath(); c.rect(X(FE.home.x - FE.hh[0]), Z(FE.home.z - FE.hh[1]), FE.hh[0] * 2 * sx, FE.hh[1] * 2 * sx); c.lineWidth = 16; c.strokeStyle = '#f2c12e'; c.setLineDash([22, 22]); c.stroke(); c.strokeStyle = '#1c1c1e'; c.lineDashOffset = 22; c.stroke(); c.restore();
    const tx = new THREE.CanvasTexture(cv); tx.anisotropy = 4;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshLambertMaterial({ map: tx, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -9, polygonOffsetUnits: -9 }));
    m.rotation.x = -Math.PI / 2; m.position.set(x0 + 6, F.y0 + 0.09, z0 + 6); m.renderOrder = 7; m.receiveShadow = true; m.userData.mk = 1; if (Render.scene) Render.scene.add(m);
  }
  const inBox = (p, b, x, z, h) => { const c = Math.cos(b.h), s = Math.sin(b.h), dx = x - b.x, dz = z - b.z; return Math.abs(dx * c + dz * s) < h[1] && Math.abs(-dx * s + dz * c) < h[0]; };
  // the player into the fire engine: the car left in the bay (a copy of its look), the fire engine's model on it, its physics the truck's
  function feIn(P) {
    const F = FT, v = Render.viewOf(P); if (!v) return;
    const copy = v.grp.clone(true); copy.position.copy(v.grp.position); copy.rotation.copy(v.grp.rotation); copy.traverse(o => { o.userData.dyn = true; }); Render.scene.add(copy);
    F.car = { x: P.x, z: P.z, h: P.h, y: P.y || 0, model: takeModel(P), vis: viewParts(v, F.T.g).map(o => [o, o.visible]), lights: (v.lights || []).map(L => L.clone()) }; F.copy = copy;
    for (const [o] of F.car.vis) o.visible = false; v.bodyG.add(F.T.g); F.T.g.position.set(0, 0, 0); F.T.g.rotation.set(0, 0, 0); F.hold.userData.hide = true; F.hold.visible = false;
    if (v.lights && v.lights.length >= 4) { v.lights[0].set(4.26, 1.1, -0.95); v.lights[1].set(4.26, 1.1, 0.95); v.lights[2].set(-4.21, 1.05, -1.0); v.lights[3].set(-4.21, 1.05, 1.0); }
    putModel(P, asModel(P, F.M)); P.place(FE.home.x, FE.home.z, FE.home.h); P.y = P.py = P.roadY = F.y0; P.vx = P.vz = 0; F.mode = 'drive';
  }
  // back into the car: the fire engine stays in its place, the car's own model again where it was left
  function feOut(P) {
    const F = FT; if (!F || F.mode !== 'drive') return; const v = Render.viewOf(P), C = F.car;
    if (v) { if (F.T.g.parent) F.T.g.parent.remove(F.T.g); for (const [o, w] of C.vis) o.visible = w; (v.lights || []).forEach((L, i) => C.lights[i] && L.copy(C.lights[i])); }
    F.place(FE.home); F.hold.userData.hide = false; F.hold.visible = F.fp.on; F.T.step(0, false);
    putModel(P, C.model); P.place(C.x, C.z, C.h); P.y = P.py = P.roadY = C.y; P.vx = P.vz = 0;
    if (F.copy) { Render.scene.remove(F.copy); F.copy = null; } F.car = null; F.mode = 'park';
  }
  function feStep(dt, P) {
    const F = FT; if (!F || !P) return; const pick = F.pick, sp = Math.hypot(P.vx || 0, P.vz || 0); F.pick = null;
    if (F.mode === 'park') { F.zone = inBox(null, FE.bay, P.x, P.z, FE.hb) && sp < FE.vMin && !(GO && GO.st.carry) && !(VT && VT.S && VT.S.carry); if (pick === 'drive' && F.zone) feIn(P); }
    else { F.zone = inBox(null, FE.home, P.x, P.z, FE.hh) && sp < FE.vMin; if (pick === 'car' && F.zone) feOut(P); }
  }
  // the parked fire engine and the car left in the bay are solid
  function feWall(x, z, y, out) {
    const F = FT; if (!F) return false;
    const box = (p, hl, hw) => { if (Math.abs(x - p.x) > 6 || Math.abs(z - p.z) > 6) return false; const c = Math.cos(p.h), s = Math.sin(p.h), dx = x - p.x, dz = z - p.z, u = dx * c + dz * s, v = -dx * s + dz * c; if (Math.abs(u) >= hl || Math.abs(v) >= hw) return false;
      const dS = hw - Math.abs(v), dE = hl - Math.abs(u); if (dS < dE) { const sv = v < 0 ? -1 : 1; out[0] = -s * sv; out[1] = c * sv; out[2] = dS; } else { const su = u < 0 ? -1 : 1; out[0] = c * su; out[1] = s * su; out[2] = dE; } return true; };
    if (F.mode === 'park') return box(FE.home, 4.25, 1.3);
    return !!(F.car && box(F.car, F.car.model.m.len / 2 + 0.05, F.car.model.m.wid / 2 + 0.05));
  }
  // the card at the top (the garages' look, js/nvmenu.js) while the car stands in the bay or the fire engine in its place
  let feEl = null;
  function feCard(live) {
    const F = FT; if (!F) return; const want = live && F.zone ? F.mode : null;
    if (!want) { if (feEl) feEl.style.display = 'none'; return; }
    if (!feEl) { if (!document.getElementById('nvf-css')) { const src = document.getElementById('nvm-css'), st = document.createElement('style'); st.id = 'nvf-css'; st.textContent = (src ? src.textContent.split('#nvm').join('#nvf') : '') + '\n#nvf .row.lk { opacity: .55; }'; document.head.appendChild(st); }
      feEl = document.createElement('div'); feEl.id = 'nvf'; feEl.style.setProperty('--c', '#ff4a3d'); feEl.style.setProperty('--ck', '#fff'); ((document.getElementById('hud') || document.body).parentElement || document.body).appendChild(feEl);
      feEl.addEventListener('pointerdown', (e) => { e.stopPropagation(); const b = e.target.closest('[data-a]'); if (!b || !FT) return; if (b.dataset.a === 'drive' || b.dataset.a === 'car') FT.pick = b.dataset.a; else { const w = feEl.querySelector('.wip'); if (w) { w.classList.add('on'); clearTimeout(feEl.wt); feEl.wt = setTimeout(() => w.classList.remove('on'), 1400); } } }); }
    if (feEl.dataset.mode !== want) { feEl.dataset.mode = want; const row = (a, t, n, sub, lk) => `<button class="row${lk ? ' lk' : ''}" data-a="${a}" style="--t:${t};--k:#fff;--bt:rgba(255,255,255,.28)">${n}<small>${sub}</small></button>`;
      feEl.innerHTML = `<div class="hd"><b>Fire engine</b><i>aerial ladder · rescue base</i></div>` + (want === 'park' ? row('drive', '#ff4a3d', 'DRIVE THE FIRE ENGINE', 'your car waits here in the bay') + row('lock', '#b3241a', 'FIREFIGHTING', 'with the missions', true) : row('car', '#ff4a3d', 'BACK TO YOUR CAR', 'the fire engine stays in its place')) +
        `<div class="ft">shown while you stand here</div><div class="wip">${tr('V izdelavi')}</div>`; }
    if (feEl.style.display !== '') feEl.style.display = '';
  }

  /* ======================= in view ======================= */
  // a place on the screen (the camera's last frame) within far metres of the camera: the park's rides and the site's machines move only
  // there (js/nvpark.js, js/nvsite.js: the user, "animirano samo blizu avta in v pogledu")
  const _fr = new THREE.Frustum(), _pm = new THREE.Matrix4(), _sp = new THREE.Sphere(); let frN = 0, frAt = -1;
  function seen(x, y, z, r, far = 260) {
    const R = typeof Render !== 'undefined' ? Render : null, cam = R && R.camera; if (!cam) return false;
    if (frAt !== frN) { frAt = frN; cam.updateMatrixWorld(); _pm.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); _fr.setFromProjectionMatrix(_pm); }
    const dx = x - cam.position.x, dz = z - cam.position.z; if (dx * dx + dz * dz > (far + r) * (far + r)) return false;
    _sp.center.set(x, y, z); _sp.radius = r; return _fr.intersectsSphere(_sp);
  }
  // things that move on the ground and the car bumps into (the site's machines: js/nvsite.js keeps H3.movers, boxes [x, z, heading, half length, half width])
  function moverWall(x, z, y, out) {
    const L = H3 && H3.movers; if (!L) return false;
    for (const m of L) { if (Math.abs(x - m.x) > 7 || Math.abs(z - m.z) > 7 || y > m.y + 3.5) continue; const c = Math.cos(m.h), s = Math.sin(m.h), dx = x - m.x, dz = z - m.z, u = dx * c + dz * s, v = -dx * s + dz * c;
      if (Math.abs(u) >= m.hl || Math.abs(v) >= m.hw) continue; const dS = m.hw - Math.abs(v), dE = m.hl - Math.abs(u);
      if (dS < dE) { const sv = v < 0 ? -1 : 1; out[0] = -s * sv; out[1] = c * sv; out[2] = dS; } else { const su = u < 0 ? -1 : 1; out[0] = c * su; out[1] = s * su; out[2] = dE; } return true; }
    return false;
  }

  /* ======================= the hooks ======================= */
  let H3 = null, trk = null, g0 = null, w0 = null;
  const FA = () => (typeof NVFair !== 'undefined' ? NVFair : null);   // (js/nvfair.js: the lunapark's big wheel and big carousel the car rides)
  function init(h3, track, o = {}) {
    H3 = h3; trk = track; if (!trk) return false;
    if (GO) { gondFinish(); GO.st = fresh(); pose(GO.st); draw(1); for (const k of ['up', 'dn']) fogIn(GO.cab[k].fp); }
    trainInit();
    if (!FT && o.player) FT = feBuild(o.player);
    if (!trk.nvRide) { g0 = trk.ground2; w0 = trk.wall2; trk.nvRide = true;
      trk.ground2 = (x, z, y) => { let d = gondGround(x, z, y); if (d == null) d = trainGround(x, z, y); return d != null ? d : g0(x, z, y); };
      trk.wall2 = (x, z, y, out) => gondWall(x, z, y, out) || trainWall(x, z, y, out) || feWall(x, z, y, out) || moverWall(x, z, y, out) || (w0 ? w0(x, z, y, out) : false); }
    if (FA()) FA().init(h3, trk);
    return true;
  }
  function reset(P) { if (GO) { GO.st = fresh(); pose(GO.st); for (const k of ['up', 'dn']) GO.cab[k].open = { b: 0, f: 0 }; draw(1); } if (VT) { VT.S = trainFresh(); trainDraw(1); } if (FT && FT.mode === 'drive' && P) feOut(P); if (FA()) FA().reset(); }
  function step(dt, P) { gondStep(dt, P); trainStep(dt, P); feStep(dt, P); if (FA()) FA().step(dt, P); }
  function post(P) { gondPost(P); trainPost(P); if (FA()) FA().post(P); }
  function frame(dt, alpha, P, live) { frN++; const a = alpha == null ? 1 : alpha; draw(a); trainDraw(a); if (FT) { FT.T.step(dt || 0, FT.mode === 'drive'); feCard(!!live); } if (FA()) FA().frame(dt, a); }
  // (js/game.js: no Na progo while the car rides; the tests)
  const on = () => !!(GO && (GO.st.carry || GO.st.cin)) || !!(VT && VT.S && VT.S.carry) || !!(FA() && FA().on());
  const state = () => GO && { mode: GO.st.mode, f: GO.st.f, carry: GO.st.carry, cin: GO.st.cin, still: GO.st.still, rides: GO.st.rides, open: { up: Object.assign({}, GO.cab.up.open), dn: Object.assign({}, GO.cab.dn.open) },
    up: Object.assign({}, GO.cab.up.p), dn: Object.assign({}, GO.cab.dn.p), A: { x: GO.SA.x, z: GO.SA.z, top: GO.SA.top }, B: { x: GO.SB.x, z: GO.SB.z, top: GO.SB.top, drop: Object.assign({}, GO.SB.drop) }, hull: GO.hull, towers: GO.towers.map(t => [t.x, t.z]) };
  // (the tests: a place on a station or in a cabin; a cabin's door)
  const spot = (which, a, c) => { const S = which === 'B' ? GO.SB : GO.SA; return { x: S.x + GO.ux * S.sgn * a + GO.nx * c, z: S.z + GO.uz * S.sgn * a + GO.nz * c, h: Math.atan2(GO.uz * S.sgn, GO.ux * S.sgn) }; };
  const train = () => VT && VT.S && { mode: VT.S.mode, s: VT.S.s, v: VT.S.v, carry: VT.S.carry, laps: VT.S.laps, rides: VT.S.rides, still: VT.S.still, L: VT.L2, wagon: VT.S.wp && Object.assign({}, VT.S.wp), st: Object.assign({}, VT.st, { ramps: VT.st.ramps.map(r => Object.assign({}, r)) }) };
  const trainSpot = (a, b) => { const [x, z] = swld(a, b); return { x, z, h: VT.st.hd }; };   // (the tests: a place on the platform)
  const fire = () => FT && { mode: FT.mode, zone: !!FT.zone, home: Object.assign({}, FE.home), bay: Object.assign({}, FE.bay), car: FT.car && { x: FT.car.x, z: FT.car.z, id: FT.car.model.m.id }, card: !!(feEl && feEl.style.display !== 'none') };
  const firePick = (k) => { if (FT) FT.pick = k; };   // (the tests: the card's choice)
  return { gondola, gondArea, init, reset, step, post, frame, on, state, spot, train, trainSpot, fire, firePick, seen, gondGround, gondWall, GD, VTK, FE };
})();
