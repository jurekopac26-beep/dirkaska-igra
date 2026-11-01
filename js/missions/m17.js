/* Special mission 17 · Ledeni most · Trois-Rivières, Kanada (js/missions.js; the kit: js/missions/kit.js). In winter the river froze: the
   ice road across it is marked with little spruces and banks of snow, round the thin ice in a loop to the town on the far bank (the
   circuit's lap: the streets of the town are the mission's own world while it lasts, the city's scenery hidden: a sheet of ice following
   the road's heights, the ice road over the street, the banks and the spruces along its edges where the walls stand, forest on the
   shores, the town's lit houses ahead, the northern lights). The truck (MisKit.skin over TITAN's physics, its own limiter K.VMAX) must
   cross at the right speed: under K.LO km/h the ice sags under it, over K.HI it cracks ahead of it (RAZPOKE grows, the more the further
   out of the band and the thinner the ice: LED, its thickness along the road); in the band the cracks close up. At 100 %: failed (the ice
   gave way). Over the line at the end of the lap: done. The first K.GRACE s (pulling away) count nothing. */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js');
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s);
  const K = { LO: 25, HI: 35, VMAX: 55, GRACE: 10, SAG: 7, CRACK: 8, HEAL: 2.5, T0: 30, T1: 58 };
  const WH = 0xe9ecef, BLU = 0x2d5b9a, GLS = 0x1d2733, BLK = 0x1b1d21, GRY = 0x8f979f;

  // the box truck: the cab, the box, two axles at the back (x forward, y up, z to the side)
  function boxTruck(B) {
    B.box(3.0, 1.55, 0, 1.9, 2.0, 2.4, BLU); B.box(3.96, 1.95, 0, 0.04, 0.85, 2.15, GLS); for (const sd of [-1, 1]) B.box(3.2, 2.0, sd * 1.21, 1.1, 0.7, 0.03, GLS);
    B.box(-1.0, 2.05, 0, 6.0, 2.7, 2.5, WH); B.box(-1.0, 3.42, 0, 5.9, 0.05, 2.4, 0xf6f8fa);
    B.box(0.2, 0.75, 0, 7.6, 0.3, 1.9, BLK);
    for (const x of [3.0, -2.2, -3.4]) for (const sd of [-1, 1]) B.cyl(x, 0.5, sd * 1.05, 0.5, 0.36, BLK);
    B.box(3.97, 0.95, 0.85, 0.05, 0.2, 0.35, 0xfff4cc); B.box(3.97, 0.95, -0.85, 0.05, 0.2, 0.35, 0xfff4cc);
    B.box(-4.01, 1.0, 1.0, 0.04, 0.3, 0.25, 0xff3a2a); B.box(-4.01, 1.0, -1.0, 0.04, 0.3, 0.25, 0xff3a2a);
  }
  // the ice's thickness along the road (cm): thinner stretches between
  const thick = (s) => K.T0 + (K.T1 - K.T0) * (0.5 + 0.32 * Math.sin(s / 83 + 1.1) + 0.18 * Math.sin(s / 31));
  const rnd = (q) => { q.v = (q.v * 16807) % 2147483647; return q.v / 2147483647; };

  // the sheet of ice round the road: a grid over the lap's box and 1.5 km beyond, each vertex at the height of the nearest piece of road
  // (far out: their mean), 0.25 m under it; snow-dusted blue-grey, lighter where the wind swept the snow (one draw)
  function sheet(T) {
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, hm = 0;
    for (let i = 0; i < T.N; i++) { x0 = Math.min(x0, T.px[i]); x1 = Math.max(x1, T.px[i]); z0 = Math.min(z0, T.pz[i]); z1 = Math.max(z1, T.pz[i]); hm += T.hy[i]; }
    hm /= T.N; const M = 1500, n = 90, X0 = x0 - M, Z0 = z0 - M, DX = (x1 - x0 + 2 * M) / n, DZ = (z1 - z0 + 2 * M) / n;
    const G = new THREE.PlaneGeometry(1, 1, n, n), p = G.attributes.position, col = new Float32Array(p.count * 3), q = { v: 11 };
    const step = Math.max(1, Math.floor(T.N / 400));
    for (let k = 0; k < p.count; k++) {
      const ix = k % (n + 1), iz = Math.floor(k / (n + 1)), x = X0 + ix * DX, z = Z0 + iz * DZ;
      let bd = 1e18, bh = hm; for (let i = 0; i < T.N; i += step) { const d = (T.px[i] - x) ** 2 + (T.pz[i] - z) ** 2; if (d < bd) { bd = d; bh = T.hy[i]; } }
      const f = Math.min(1, Math.sqrt(bd) / 400), y = bh * (1 - f) + hm * f - 0.25;
      p.setXYZ(k, x, y, z);
      const w = 0.86 + 0.1 * rnd(q) + 0.05 * Math.sin(x / 37 + z / 53);
      col[k * 3] = 0.84 * w; col[k * 3 + 1] = 0.9 * w; col[k * 3 + 2] = 0.97 * w;
    }
    G.setAttribute('color', new THREE.BufferAttribute(col, 3)); G.computeVertexNormals();
    const m = new THREE.Mesh(G, new THREE.MeshLambertMaterial({ vertexColors: true })); m.receiveShadow = true;
    return { m, box: [x0, x1, z0, z1], hm };
  }
  // spruces: one instanced mesh (two cones and a trunk merged), each put with put(x, y, z, size)
  function spruces(max) {
    const B = KIT.parts(); B.L.push({ g: new THREE.ConeGeometry(1.0, 2.2, 7), m: new THREE.Matrix4().makeTranslation(0, 1.6, 0), c: 0x1d3a2c });
    B.L.push({ g: new THREE.ConeGeometry(0.7, 1.7, 7), m: new THREE.Matrix4().makeTranslation(0, 2.7, 0), c: 0x24463a });
    B.L.push({ g: new THREE.CylinderGeometry(0.12, 0.15, 0.7, 5), m: new THREE.Matrix4().makeTranslation(0, 0.35, 0), c: 0x3a2a1e });
    const I = new THREE.InstancedMesh(KIT.merged(B.L), new THREE.MeshLambertMaterial({ vertexColors: true }), max); I.count = 0; I.castShadow = true; I.frustumCulled = false;
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), P = new THREE.Vector3();
    I.put = (x, y, z, s) => { if (I.count >= max) return; M.compose(P.set(x, y, z), Q, S.set(s, s, s)); I.setMatrixAt(I.count++, M); I.instanceMatrix.needsUpdate = true; };
    return I;
  }
  // the town on the far bank: houses and a church, their windows lit (two draws)
  function town(c, ry, y) {
    const B = KIT.parts(), W = KIT.parts(), q = { v: 5 };
    for (let k = 0; k < 26; k++) {
      const x = -180 + rnd(q) * 360, z = rnd(q) * 90, L = 8 + rnd(q) * 8, D = 7 + rnd(q) * 5, H = 5 + rnd(q) * 6, c2 = [0xb04a3a, 0xd8c7a0, 0x7f8f9c, 0xe3e0d6][k % 4];
      B.box(x, H / 2, z, L, H, D, c2); B.box(x, H + 0.3, z, L + 0.6, 0.6, D + 0.6, 0xf2f5f8);
      for (let f = 0; f < Math.floor(H / 3); f++) for (let w = 0; w < 3; w++) if (rnd(q) < 0.7) W.box(x - L / 3 + w * L / 3, 2 + f * 3, z - D / 2 - 0.05, 1.2, 1.1, 0.1, 0);
    }
    B.box(0, 14, 30, 7, 28, 7, 0xd8d2c4); B.box(0, 31, 30, 4, 6, 4, 0x6f7f8a); W.box(0, 22, 26.4, 1.6, 2.6, 0.1, 0);
    const g = new THREE.Group();
    g.add(B.mesh(new THREE.MeshLambertMaterial({ vertexColors: true })));
    g.add(new THREE.Mesh(KIT.merged(W.L), new THREE.MeshBasicMaterial({ color: 0xffcf7a })));
    g.position.set(c[0], y, c[1]); g.rotation.y = ry;
    return g;
  }
  // the northern lights: a curtain far off in the sky, green to violet, slowly waving (one draw, no fog)
  function aurora(cx, cz, a0, y) {
    const G = new THREE.PlaneGeometry(1, 1, 48, 1), p = G.attributes.position;
    for (let k = 0; k < p.count; k++) { const u = p.getX(k) + 0.5, v = p.getY(k) + 0.5, a = a0 - 1.1 + u * 2.2, R = 2600 + 300 * Math.sin(u * 7);
      p.setXYZ(k, cx + Math.cos(a) * R, y + 260 + v * (520 + 160 * Math.sin(u * 11)), cz + Math.sin(a) * R); }
    const U = { uT: { value: 0 } };
    const mat = new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform float uT; varying vec2 vUv; void main(){ float w = 0.5 + 0.5 * sin(vUv.x * 40.0 + uT * 0.6 + sin(vUv.x * 9.0 - uT * 0.3) * 2.0); float a = smoothstep(0.0, 0.25, vUv.y) * (1.0 - vUv.y) * (0.35 + 0.65 * w) * smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x); vec3 c = mix(vec3(0.2, 1.0, 0.55), vec3(0.6, 0.35, 1.0), smoothstep(0.45, 1.0, vUv.y)); gl_FragColor = vec4(c * a * 0.55, 1.0); }' });
    const m = new THREE.Mesh(G, mat); m.frustumCulled = false; m.renderOrder = -1; m.userData.U = U;
    return m;
  }
  // the cracks: dark lines on the ice round the truck (one draw, a ring of segments reused)
  function cracks(max) {
    const pos = new Float32Array(max * 6), G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.BufferAttribute(pos, 3)); G.setDrawRange(0, 0);
    const L = new THREE.LineSegments(G, new THREE.LineBasicMaterial({ color: 0x23323f, transparent: true, opacity: 0.85 })); L.frustumCulled = false;
    let n = 0, used = 0; const q = { v: 3 };
    // a crack from (x, z): a zigzag of 4 pieces out along angle a
    L.crack = (x, y, z, a, len) => {
      let px = x, pz = z;
      for (let k = 0; k < 4; k++) { const b = a + (rnd(q) - 0.5) * 1.1, l = len * (0.2 + rnd(q) * 0.2), nx = px + Math.cos(b) * l, nz = pz + Math.sin(b) * l;
        pos.set([px, y, pz, nx, y, nz], n * 6); n = (n + 1) % max; used = Math.min(max, used + 1); px = nx; pz = nz; }
      G.attributes.position.needsUpdate = true; G.setDrawRange(0, used * 2);
    };
    return L;
  }

  Missions.add({
    id: '17', title: 'Ledeni most', track: 'troisrivieres', limit: 420, stars: [300, 345], K,
    story: 'Pozimi je reka zamrznila. Čez led vodi označena cesta do mesta na drugem bregu.',
    goal: 'Pelji tovornjak čez led z ravno pravo hitrostjo.',
    hint: 'Drži hitrost v zelenem pasu: prepočasi se led ugreza, prehitro poči.',
    rows: [{ k: 'hitrost', label: 'VARNA HITROST 25–35', bar: true }, { k: 'led', label: 'LED', bar: true, col: '#4a8cff' }, { k: 'razpoke', label: 'RAZPOKE', bar: true, col: '#e8452c' }],
    // alone, one lap, at night in winter; the truck: TITAN's physics, slow, no damage
    opts: () => ({ tt: true, laps: 1, playerModel: KIT.truckModel('titan', { vLim: K.VMAX, kw: 260, len: 8.0, wid: 2.5, mass: 9000 }), playerColor: WH, damage: 0 }),
    begin(r) {
      const T = r.race.track;
      r.cr = 0; r.sag = 0; r.kmh = 0; r.went = false; r.lastCrack = 0;
      if (typeof Render !== 'undefined' && Render.setAtmos) Render.setAtmos({ season: 'winter', tod: 'night' }, true);
      if (typeof THREE !== 'undefined' && typeof document !== 'undefined' && typeof Render !== 'undefined') {
        // the city's scenery hidden while the run lasts: the river's ice is the world
        const W = Render.world, root = W && W.root;
        if (root) { root.visible = false; const g = new THREE.Group(); g.userData.misUndo = () => { root.visible = true; }; r.add(g); }
        const S = sheet(T); r.add(S.m);
        KIT.cover(r, T, 0, T.len + 3, { tex: KIT.snowTex('ice'), w: 0.9, lift: 0.04, rep: 8, across: 2 });
        KIT.piles(r, T, 0, T.len, { every: 3, off: 0.9, h: 0.6, col: 0xf6f9fc });
        const I = spruces(1400), q = { v: 9 }; r.add(I);
        for (let s = 0; s < T.len; s += 16) { const i = T.idx(s); for (const sd of [-1, 1]) { const o = T.wS(s) + 3.2 + rnd(q) * 0.6; I.put(T.px[i] + T.nx[i] * o * sd, T.hy[i] - 0.1, T.pz[i] + T.nz[i] * o * sd, 1.0 + rnd(q) * 0.4); } }
        // the shores' forest, a ring out from the lap (gaps where the town stands)
        const [x0, x1, z0, z1] = S.box, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, R0 = Math.hypot(x1 - x0, z1 - z0) / 2 + 280;
        const i0 = T.idx(T.startS), ta = Math.atan2(T.tz[i0], T.tx[i0]);
        for (let k = 0; k < 1100; k++) { const a = rnd(q) * 6.283, R = R0 + rnd(q) * 700; let d = a - ta; while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283; if (Math.abs(d) < 0.22) continue;
          I.put(cx + Math.cos(a) * R, S.hm - 0.3, cz + Math.sin(a) * R, 2.5 + rnd(q) * 3); }
        // the town ahead from the start line, on the far bank
        const tc = [cx + Math.cos(ta) * (R0 + 120), cz + Math.sin(ta) * (R0 + 120)];
        r.add(town(tc, -ta - Math.PI / 2, S.hm));
        r.aur = aurora(cx, cz, ta, S.hm); r.add(r.aur);
        r.cracks = cracks(600); r.add(r.cracks);
        r.skin = KIT.skin(r, r.P, boxTruck);
        if (r.skin) { const v = Render.viewOf(r.P); if (v && v.lights && v.lights.length >= 4) { v.lights[0].set(4.0, 0.95, -0.85); v.lights[1].set(4.0, 0.95, 0.85); v.lights[2].set(-4.05, 1.0, -1.0); v.lights[3].set(-4.05, 1.0, 1.0); } }
      }
      this.show(r);
    },
    step(r, dt) {
      const P = r.P, T = r.race.track, q = P.q; if (!q) return;
      const v = Math.hypot(P.vx || 0, P.vz || 0), kmh = v * 3.6; r.kmh = kmh;
      if (kmh >= K.LO) r.went = true;
      const th = thick(q.s), thin = 40 / th;
      // the ice: sags under a slow truck, cracks ahead of a fast one; in the band the cracks close
      let d = 0, how = 0;
      if (r.t > K.GRACE || r.went) {
        if (kmh < K.LO) { d = (K.LO - kmh) / K.LO * K.SAG * thin; how = -1; } else if (kmh > K.HI) { d = Math.min(2, (kmh - K.HI) / 10) * K.CRACK * thin; how = 1; } else d = -K.HEAL;
      }
      r.cr = Math.max(0, Math.min(100, r.cr + d * dt));
      r.sag += ((how < 0 ? Math.min(1, d / K.SAG) : 0) - r.sag) * Math.min(1, dt * 2);
      if (r.skin) r.skin.position.y = -0.22 * r.sag;   // (the truck sinking a little into the sagging ice)
      // the cracks drawn: round the truck when it sags, ahead of it when too fast
      if (r.cracks && how && r.t - r.lastCrack > 0.6 / Math.max(0.3, Math.abs(d) / 4)) {
        r.lastCrack = r.t;
        const a = (P.h || 0) + (how > 0 ? (Math.random() - 0.5) * 1.2 : Math.random() * 6.283), o = how > 0 ? 7 + Math.random() * 5 : 1.5 + Math.random() * 2.5;
        r.cracks.crack(P.x + Math.cos(a) * o, T.hy[T.idx(q.s)] + 0.08, P.z + Math.sin(a) * o, a, 6 + Math.random() * 6);
      }
      if (r.aur) r.aur.userData.U.uT.value = r.t;
      if (r.cr >= 100) { this.show(r); r.fail(tr(how > 0 ? 'Led je počil pred tovornjakom.' : 'Led se je udrl pod tovornjakom.')); return; }
      r.say(how > 0 ? 'Prehitro: led poka pred tabo!' : how < 0 ? 'Prepočasi: led se ugreza pod tovornjakom!' : this.hint);
      this.show(r);
    },
    finish(r) { r.win(); },
    show(r) {
      const k = r.kmh || 0, ok = k >= K.LO && k <= K.HI, th = r.P.q ? thick(r.P.q.s) : thick(0);
      r.set('hitrost', Math.round(k) + ' km/h', k / 50, ok ? '#3fbf6a' : Math.abs(k - (K.LO + K.HI) / 2) < 10 ? '#ffb020' : '#e8452c');
      r.set('led', Math.round(th) + ' cm', th / 60, th < 38 ? '#ffb020' : '#4a8cff');
      r.set('razpoke', Math.round(r.cr) + ' %', r.cr / 100, '#e8452c');
    },
    // the tests' and the pictures' driver: round the lap in the band (tools/misija-slika.mjs)
    pilot(r, o) { return KIT.pilot(r.P, r.race.track, Object.assign({ dir: 1, v: 8.4, lat: 3.2 }, o)); },
  });
})();
