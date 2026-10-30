/* Special mission 35 · Reševalci na plaži · Newcastle, Avstralija (js/missions.js; the kit: js/missions/kit.js, the water: MisKit.boat,
   skin, tags, button). A swimmer caught in a rip current off Newcastle Beach is being carried out beyond the waves. The lifeguard's quad
   (the kart's physics, its own body of simple bodies: MisKit.skin) drives from the pit straight, round Turn 1, up the hill, round
   Turn 2 and down along the beach to the place over it (s K.STOP, within K.ZONE m, slower than K.VSTOP m/s): PRESEDI NA SKUTER and the
   lifeguard is at the water's edge on the jet ski (a cut: the road is 15 m over the beach behind its wall). The jet ski (MisKit.boat: its
   own numbers on the sea at 0 m, steered with the player's controls, the camera behind it) goes out over the swell (its own mesh: long
   crests K.WLEN m apart, K.WAVE m high, coming in at K.WV m/s, foaming as they break near the beach; under the world's flat sea in the
   troughs). Only on the sea (the world's ground K.DEEP m under it, inside the swell's area): never onto the sand or the rocks. The swimmer
   shows only when a crest lifts him (the wave's phase over K.TOP: POMOČ! over him; always within K.NEAR m) and the rip takes him out and
   along (K.RIP m/s); a red ring on the water is where he was last seen: seen from within K.SIGHT m it shrinks (K.R0 m down to K.RMIN).
   Beside him (K.PICK m) and slow (under K.VPICK m/s) for K.PULL s: pulled onto the rescue sled; then the jet ski tows it (at most
   K.VTOW m/s) back to the beach (within K.HOME m of the water's edge, K.HOMEU m along it from the start): done, the camera back on the
   quad. The swimmer's strength (MOČ PLAVALCA) falls K.TIRE a second (more in the troughs: the waves break over him); at 0: failed. */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js');
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s), dec = (s) => (typeof Lang !== 'undefined' ? Lang.dec(s) : String(s));
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v), sstep = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  // the beach (world-newcastle.js: the sea a plane at 0 m, its bed at -2.5 m, the sand ~3 m): the water's edge E below the stop, the sea
  // outward along N, along the beach U (+: south-east, toward the rocks under the headland); d m out, u m along
  const E = [-96, 606], N = [0.6, 0.8], U = [0.8, -0.6];
  const K = { S0: 150, STOP: 1000, ZONE: 22, VSTOP: 1.6, WAVE: 1.2, WLEN: 36, WV: 5.5, TOP: 0.55, NEAR: 16, SIGHT: 45, R0: 40, RMIN: 8,
    PICK: 5, VPICK: 2.2, PULL: 1.6, HOME: 14, HOMEU: 70, SW: [175, 20], RIP: [0.15, 0.1], STR0: 0.62, TIRE: 0.0019, VMAX: 15, ACC: 9, VTOW: 7, BUMP: 3,
    UC: -50, UW: [110, 165], DMAX: [260, 330], DEEP: 0.6 };
  const seaD = (x, z) => (x - E[0]) * N[0] + (z - E[1]) * N[1];
  const seaU = (x, z) => (x - E[0]) * U[0] + (z - E[1]) * U[1];
  const at = (d, u) => [E[0] + N[0] * d + U[0] * u, E[1] + N[1] * d + U[1] * u];
  const gH = (x, z) => { const W = typeof Render !== 'undefined' && Render.world; return W && W.groundH ? W.groundH(x, z) : (seaD(x, z) > 2 ? -2.5 : 3); };
  // the swell's height share over the sea (0 on the beach, the rocks, far off, at the area's sides) and its phase (-1..1: 1 on a crest)
  const ampAt = (x, z) => { const d = seaD(x, z), u = Math.abs(seaU(x, z) - K.UC); return sstep(6, 40, d) * (1 - sstep(K.DMAX[0], K.DMAX[1], d)) * (1 - sstep(K.UW[0], K.UW[1], u)); };
  const phase = (d, t) => Math.sin((d + K.WV * t) / K.WLEN * Math.PI * 2);
  const wave = (x, z, t) => { const a = ampAt(x, z); return a > 0 ? K.WAVE * a * 0.5 * (1 + phase(seaD(x, z), t)) : 0; };
  const sea = (x, z) => { const d = seaD(x, z), u = Math.abs(seaU(x, z) - K.UC); return d > 1 && d < K.DMAX[1] && u < K.UW[1] && gH(x, z) < -K.DEEP; };

  // the quad: red body over four fat black wheels, its racks, the rescue board on the back rack, the lifeguard astride (yellow, red cap)
  function quad(B) {
    const RD = 0xd8282a, BLK = 0x1b1d21, YEL = 0xf2c230, GRY = 0x5c636b, SKN = 0xd9a77e;
    for (const [x, z] of [[0.68, 0.62], [0.68, -0.62], [-0.68, 0.62], [-0.68, -0.62]]) B.cyl(x, 0.34, z, 0.34, 0.3, BLK);
    B.box(0, 0.42, 0, 1.6, 0.18, 0.7, GRY);                                                    // (the frame)
    B.box(0.68, 0.72, 0, 0.62, 0.16, 1.5, RD); B.box(-0.68, 0.72, 0, 0.62, 0.16, 1.5, RD);     // (the fenders over the wheels)
    B.box(0.05, 0.7, 0, 0.9, 0.3, 0.62, RD); B.box(0.98, 0.62, 0, 0.12, 0.2, 0.9, GRY);        // (the tank, the bumper)
    B.box(-0.2, 0.9, 0, 0.6, 0.12, 0.38, BLK);                                                 // (the seat)
    B.box(0.42, 1.02, 0, 0.08, 0.08, 0.86, GRY); B.box(0.42, 0.88, 0, 0.08, 0.26, 0.08, GRY);  // (the handlebar)
    B.box(-0.8, 0.84, 0, 0.4, 0.05, 1.2, GRY); B.box(-0.82, 0.92, 0, 1.6, 0.07, 0.42, 0xf2c230); // (the back rack, the rescue board across it)
    B.box(-0.15, 1.3, 0, 0.32, 0.62, 0.44, YEL); B.box(-0.13, 1.74, 0, 0.22, 0.22, 0.22, SKN); B.box(-0.13, 1.87, 0, 0.25, 0.07, 0.25, RD);
    B.box(0.18, 1.32, 0.22, 0.45, 0.1, 0.1, SKN); B.box(0.18, 1.32, -0.22, 0.45, 0.1, 0.1, SKN); // (the arms to the handlebar)
    B.box(-0.05, 0.92, 0.26, 0.4, 0.14, 0.12, 0x1d3f7a); B.box(-0.05, 0.92, -0.26, 0.4, 0.14, 0.12, 0x1d3f7a);   // (the legs)
  }
  // the jet ski (x forward: white hull, red deck, the lifeguard), the rescue sled behind it; the swimmer lying on the sled once picked up
  function jetski(r) {
    if (typeof THREE === 'undefined' || !KIT.parts) return null;
    const B = KIT.parts(), RD = 0xd8282a, WH = 0xf2f4f6, BLK = 0x1b1d21, YEL = 0xf2c230, SKN = 0xd9a77e;
    B.box(0, 0.32, 0, 2.6, 0.5, 1.1, WH); B.box(1.45, 0.36, 0, 0.5, 0.36, 0.7, WH); B.box(0.1, 0.6, 0, 2.2, 0.08, 1.14, RD);
    B.box(-0.35, 0.78, 0, 1.1, 0.24, 0.42, BLK); B.box(0.6, 0.78, 0, 0.4, 0.3, 0.6, RD); B.box(0.62, 1.0, 0, 0.1, 0.1, 0.84, 0x50565e);
    B.box(-0.35, 1.25, 0, 0.32, 0.6, 0.44, YEL); B.box(-0.33, 1.68, 0, 0.22, 0.22, 0.22, SKN); B.box(-0.33, 1.81, 0, 0.25, 0.07, 0.25, RD);
    B.box(0.15, 1.25, 0.22, 0.6, 0.1, 0.1, SKN); B.box(0.15, 1.25, -0.22, 0.6, 0.1, 0.1, SKN);
    B.box(-1.6, 0.42, 0, 0.7, 0.05, 0.05, BLK); B.box(-2.75, 0.22, 0, 1.7, 0.16, 1.1, YEL); B.box(-2.75, 0.32, 0.5, 1.7, 0.08, 0.08, RD); B.box(-2.75, 0.32, -0.5, 1.7, 0.08, 0.08, RD);
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true }), g = new THREE.Group(); g.add(B.mesh(mat));
    const S = KIT.parts(); S.box(-2.85, 0.42, 0, 1.25, 0.2, 0.42, 0x3a6fd0); S.box(-2.08, 0.45, 0, 0.24, 0.24, 0.24, 0xff7a00);
    const sw = S.mesh(mat); sw.visible = false; g.add(sw); r.onSled = sw;
    return g;
  }
  // the swimmer in the water: an orange cap, the face, an arm up (one mesh)
  function swimmer() {
    const B = KIT.parts(); B.box(0, 0.2, 0, 0.34, 0.3, 0.34, 0xd9a77e); B.box(0, 0.38, 0, 0.36, 0.1, 0.36, 0xff7a00);
    B.box(0, 0.62, 0.32, 0.12, 0.8, 0.12, 0xd9a77e); B.box(0, 0.06, 0, 0.7, 0.12, 0.7, 0xe8f2f6);
    return B.mesh(new THREE.MeshLambertMaterial({ vertexColors: true }));
  }
  // the swell: one strip of the sea (along N every K.ROW m, a few columns along the beach) lifted each frame by wave(), its colour from
  // the deep blue to the crest's light green and the foam where it breaks; under the world's sea in the troughs (one draw)
  const ROW = 2.5, COLS = [-165, -140, -110, -60, 0, 60, 110, 140, 165];
  function swell(r) {
    const nr = Math.round((K.DMAX[1] - 4) / ROW) + 1, nc = COLS.length, n = nr * nc, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), amp = new Float32Array(n), dd = new Float32Array(n), idx = [];
    for (let j = 0; j < nr; j++) for (let i = 0; i < nc; i++) { const k = j * nc + i, d = 4 + j * ROW, [x, z] = at(d, K.UC + COLS[i]); pos[k * 3] = x; pos[k * 3 + 2] = z; dd[k] = d;
      amp[k] = ampAt(x, z) * clamp((-gH(x, z) - 0.3) / 1.7, 0, 1); }   // (none over the sand and the rocks)
    for (let j = 0; j < nr - 1; j++) for (let i = 0; i < nc - 1; i++) { const a = j * nc + i, b = a + 1, c = a + nc, e = c + 1; idx.push(a, c, b, b, c, e); }   // (the faces up)
    const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.BufferAttribute(pos, 3)); G.setAttribute('color', new THREE.BufferAttribute(col, 3)); G.setIndex(idx);
    G.computeVertexNormals(); const bc = at(K.DMAX[1] / 2, K.UC); G.boundingSphere = new THREE.Sphere(new THREE.Vector3(bc[0], 0.5, bc[1]), 240);
    const m = new THREE.Mesh(G, new THREE.MeshLambertMaterial({ vertexColors: true }));
    m.renderOrder = 1; r.add(m);
    const deep = [0.13, 0.38, 0.6], crest = [0.2, 0.48, 0.62], foam = [0.86, 0.92, 0.95];
    return { m, step(t) {
      for (let k = 0; k < n; k++) { const a = amp[k], p = 0.5 * (1 + phase(dd[k], t)), h = K.WAVE * a * p, br = 1 - sstep(20, 45, dd[k]);
        pos[k * 3 + 1] = h - 0.12;
        const c1 = p * p * a, f = clamp(sstep(0.8, 0.99, p) * (0.3 + 0.6 * br) * a, 0, 0.85);
        for (let q = 0; q < 3; q++) col[k * 3 + q] = (deep[q] + (crest[q] - deep[q]) * c1) * (1 - f) + foam[q] * f; }
      G.attributes.position.needsUpdate = true; G.attributes.color.needsUpdate = true; G.computeVertexNormals();
    } };
  }
  // the camera behind the jet ski: as behind the car, a little lower to see the swell and the sea ahead (upright: higher, further back)
  function skiCam(S) {
    return function (dt) {
      const C = typeof Render !== 'undefined' ? Render.camera : null, Sh = S.shot; if (!C || !Sh) return;
      const up = C.aspect < 1, uc = Render.cam || {}, D = (up ? 24 : 17) * (uc.userZoom || 1), pitch = (up ? 0.78 : 0.6) * (1 - (uc.userTilt || 0)), a0 = up ? 10 : 7;
      S.hs += Math.atan2(Math.sin(S.h - S.hs), Math.cos(S.h - S.hs)) * (1 - Math.exp(-dt * 3));
      const fx = Math.cos(S.hs), fz = Math.sin(S.hs), tx = S.x + fx * a0, tz = S.z + fz * a0, ty = 0.5;
      Sh.tx = tx; Sh.ty = ty; Sh.tz = tz; Sh.px = tx - fx * D * Math.cos(pitch); Sh.pz = tz - fz * D * Math.cos(pitch); Sh.py = ty + D * Math.sin(pitch);
      Sh.fov = up ? 58 : 46; Sh.fogD = D * 1.4; Sh.gy = 0;
    };
  }

  Missions.add({
    id: '35', title: 'Reševalci na plaži', track: 'newcastle', stars: [150, 195], K,
    story: 'Poletje na plaži. Tok je plavalca odnesel za valove in zmanjkuje mu moči.',
    goal: 'S štirikolesnikom in skuterjem reši plavalca.',
    hint: 'Nad plažo presedi na skuter in pelji do plavalca.',
    rows: [{ k: 'dist', label: 'PLAVALEC' }, { k: 'moc', label: 'MOČ PLAVALCA', bar: true, col: '#e8452c' }, { k: 'val', label: 'VALOVI' }],
    // alone on the closed streets, by day, dry; the quad on the kart's physics (a little slower)
    opts: () => ({ tt: true, laps: 1, playerModel: KIT.truckModel('mravlja', { vLim: 75 }), playerColor: 0xd8282a, damage: 0 }),
    // it starts on the pit straight before Turn 1, K.STOP - K.S0 m before the place over the beach
    made(race) {
      const T = race.track, c = race.player; if (!c) return;
      const s = (T.startS + K.S0) % T.len, i = T.idx(s);
      c.place(T.px[i], T.pz[i], T.hd[i]); if (T.hasElev) { c.y = c.py = T.hy[i]; c.roadY = c.y; }
      c.dist = s - T.startS; c.q = T.query(T.px[i], T.pz[i], i, {}); c.sPrev = c.q.s;
      while (c.cp < T.cpS.length && c.dist >= T.cpDist[c.cp]) { c.splits.push(0); c.cp++; }
    },
    begin(r) {
      const sw = at(K.SW[0], K.SW[1]), s0 = at(4, 0);
      r.stage = 'quad'; r.str = K.STR0; r.sw = { x: sw[0], z: sw[1] }; r.ring = { x: sw[0] + 14, z: sw[1] - 9, R: K.R0 }; r.seen = false; r.pull = 0; r.nSeen = 0; r.home = null;
      r.skin = KIT.skin(r, r.P, quad);
      const mesh = jetski(r);
      r.ski = KIT.boat(r, { x: s0[0], z: s0[1], h: Math.atan2(N[1], N[0]), y: 0, vmax: K.VMAX, acc: K.ACC, turn: 1.5, D: [24, 17], mesh, wave, wet: sea });
      r.ski.cam = skiCam(r.ski);
      r.tags = KIT.tags(r); r.btn = KIT.button(r, 'PRESEDI NA SKUTER');
      if (typeof THREE !== 'undefined') {
        r.swM = swimmer(); r.swM.visible = false; r.add(r.swM);
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.93, 1, 48), new THREE.MeshBasicMaterial({ color: 0xff3030, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
        ring.rotation.x = -Math.PI / 2; ring.renderOrder = 3; r.ringM = ring; r.add(ring);
        r.sea = swell(r); r.sea.step(0);
        // the lifeguards' tower on the sand by the water's edge (four legs, the red hut, its roof, the window to the sea)
        const B = KIT.parts(); for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) B.box(x, 1.6, z, 0.18, 3.2, 0.18, 0xe8eaee);
        B.box(0, 4.0, 0, 2.6, 1.8, 2.6, 0xc4301c); B.box(0, 5.05, 0, 3.1, 0.3, 3.1, 0xeeeeee); B.box(1.32, 4.15, 0, 0.04, 0.8, 1.9, 0x1d2733); B.box(1.9, 3.15, 0, 1.4, 0.1, 2.0, 0xd8d0b8);
        const tw = B.mesh(new THREE.MeshLambertMaterial({ vertexColors: true })), tp = at(-16, -18);
        tw.position.set(tp[0], gH(tp[0], tp[1]) - 0.1, tp[1]); tw.rotation.y = -Math.atan2(N[1], N[0]); r.add(tw); r.tower = tw;
      }
      this.show(r);
    },
    step(r, dt) {
      const P = r.P, s = P.q ? P.q.s : 0, v = Math.hypot(P.vx || 0, P.vz || 0), S = r.ski, st = r.t;   // (the waves' clock: the run's, the jet ski's own the same)
      const dS = seaD(r.sw.x, r.sw.z), lift = 0.5 * (1 + phase(dS, st));
      // the swimmer tires (more in the troughs: the waves break over him), the rip takes him out and along
      if (r.stage === 'quad' || r.stage === 'ski') {
        r.str -= K.TIRE * dt * (1 + 0.6 * (1 - lift));
        const nx = r.sw.x + (N[0] * K.RIP[0] + U[0] * K.RIP[1]) * dt, nz = r.sw.z + (N[1] * K.RIP[0] + U[1] * K.RIP[1]) * dt;
        if (sea(nx, nz)) { r.sw.x = nx; r.sw.z = nz; }
      }
      if (r.str <= 0) { r.str = 0; if (S.on) S.go(false); r.fail(tr('Plavalcu je zmanjkalo moči.')); }
      // seen when a crest lifts him: the ring goes round where he is, smaller when seen from close by
      const was = r.seen, dSw = Math.hypot(r.sw.x - S.x, r.sw.z - S.z);
      r.seen = (r.stage === 'quad' || (r.stage === 'ski' && dSw < K.SIGHT)) && phase(dS, st) > K.TOP;   // (from the road high over the beach: always on a crest; low on the jet ski: only from close by)
      if (r.seen && !was) {
        r.nSeen++; if (r.stage === 'ski' && dSw < K.SIGHT) r.ring.R = Math.max(K.RMIN, r.ring.R * 0.7);
        const a = r.nSeen * 2.3, k = r.ring.R * 0.4; r.ring.x = r.sw.x + Math.cos(a) * k; r.ring.z = r.sw.z + Math.sin(a) * k;
      }
      if (r.stage === 'quad') {
        const inZ = Math.abs(s - K.STOP) < K.ZONE;
        if (inZ && v < 6) { const f = Math.exp(-dt * 2.5); P.vx *= f; P.vz *= f; }
        const can = inZ && v < K.VSTOP; r.btn.show(can);
        if (can && (r.btn.take() || r.autoSki)) { r.stage = 'ski'; r.btn.show(false); KIT.hold(P); S.go(true); r.autoSki = false; }
        else r.say(can ? 'Presedi na skuter!' : inZ ? 'Ustavi nad plažo.' : s > K.STOP + K.ZONE ? 'Plažo si zgrešil: vrni se nazaj.' : tr('Do plaže: {0} m', Math.max(0, Math.round(K.STOP - s))));
        P.wrongT = 0; if (inZ) P.stuckT = 0;
      }
      if (r.stage === 'ski' || r.stage === 'sled') {
        // the player's controls (set by the game before the race's step) steer the jet ski; the quad stays parked
        const I = r.autoIn || [P.inSteer || 0, P.inThr || 0, P.inBrk || 0];
        KIT.hold(P); P.wrongT = 0; P.stuckT = 0;
        if (r.stage === 'sled') S.v = Math.min(S.v, K.VTOW);
        S.step(dt, I[0], I[1], I[2]);
        if (r.stage === 'sled') S.v = Math.min(S.v, K.VTOW);
        // up the face of a crest the jet ski loses speed (out through the waves is slower than back in with them)
        { const fx = Math.cos(S.h) * 2, fz = Math.sin(S.h) * 2, climb = (wave(S.x + fx, S.z + fz, st) - wave(S.x - fx, S.z - fz, st)) / 4; if (climb > 0 && S.v > 0) S.v *= Math.exp(-dt * climb * K.BUMP); }
        const dN = Math.hypot(r.sw.x - S.x, r.sw.z - S.z);
        if (r.stage === 'ski') {
          if (dN < K.PICK && S.speed < K.VPICK) { r.pull += dt; if (r.pull >= K.PULL) { r.stage = 'sled'; if (r.onSled) r.onSled.visible = true; } } else r.pull = 0;
          r.say(dN < K.PICK * 2 ? (S.speed < K.VPICK ? 'Plavalca vlečeš na sani …' : 'Ustavi ob plavalcu.') : r.seen ? 'Plavalec je na valu: pelji tja!' : 'Pelji do rdečega kroga; plavalec se pokaže na vrhu vala.');
        }
        if (r.stage === 'sled') {
          const d = seaD(S.x, S.z), u = seaU(S.x, S.z);
          r.home = Math.max(0, d - K.HOME) + Math.max(0, Math.abs(u) - K.HOMEU);
          if (r.home <= 0) { r.stage = 'done'; S.go(false); r.win(); }
          else r.say('Plavalec je na saneh: pelji nazaj na obalo.');
        }
      } else S.step(dt, 0, 0, 0);   // (on the quad: the jet ski waits at the water's edge, its clock with the waves')
      // the swell, the swimmer, the ring drawn; the tags
      if (r.sea) r.sea.step(st);
      if (r.swM) { const nearV = r.stage === 'ski' && dSw < K.NEAR; r.swM.visible = r.seen || nearV; r.swM.position.set(r.sw.x, wave(r.sw.x, r.sw.z, st) - 0.25, r.sw.z); r.swM.rotation.y = Math.sin(st * 2) * 0.4; }
      if (r.ringM) { r.ringM.visible = r.stage === 'quad' || r.stage === 'ski'; r.ringM.position.set(r.ring.x, K.WAVE + 0.1, r.ring.z); r.ringM.scale.set(r.ring.R, r.ring.R, 1); }
      const tg = [];
      if (r.stage === 'quad' && s > K.STOP - 250 && s < K.STOP + K.ZONE) { const i = r.race.track.idx(K.STOP), T = r.race.track; tg.push({ x: T.px[i], y: T.hy[i] + 3, z: T.pz[i], cls: 'go', html: '<b>' + tr('USTAVI TU') + '</b>' }); }
      if (r.seen) tg.push({ x: r.sw.x, y: 2.8, z: r.sw.z, cls: 'go', html: '<b>' + tr('POMOČ!') + '</b>' });
      else if (r.stage === 'ski' || r.stage === 'quad') tg.push({ x: r.ring.x, y: 3, z: r.ring.z, html: '<b>' + tr('ZADNJIČ VIDEN') + '</b>' + tr('krog iskanja {0} m', Math.round(r.ring.R)) });
      if (r.stage === 'sled') { const h = at(2, clamp(seaU(S.x, S.z), -K.HOMEU + 10, K.HOMEU - 10)); tg.push({ x: h[0], y: 4, z: h[1], cls: 'go', html: '<b>' + tr('OBALA') + '</b>' }); }
      r.tags.set(tg);
      this.show(r);
    },
    // past the beach round the lap to the finish line: not done
    finish(r) { if (r.stage !== 'done') r.fail(tr('Zapeljal si mimo plaže.')); },
    show(r) {
      const S = r.ski, onSled = r.stage === 'sled' || r.stage === 'done';
      const d = r.stage === 'quad' ? Math.hypot(r.sw.x - (r.P.x || 0), r.sw.z - (r.P.z || 0)) : Math.hypot(r.sw.x - S.x, r.sw.z - S.z);
      r.set('dist', onSled ? tr('na saneh') : '~' + Math.max(5, Math.round(d / 5) * 5) + ' m');
      const f = Math.max(0, r.str);
      r.set('moc', Math.round(f * 100) + ' %', f, f > 0.5 ? '#3fbf6a' : f > 0.25 ? '#ffb020' : '#e8452c');
      r.set('val', dec(K.WAVE.toFixed(1)) + ' m');
    },
  });
})();
