/* Special mission 35 · Reševalci na plaži · Newcastle, Avstralija (js/missions.js; the kit: js/missions/kit.js, the water: MisKit.boat,
   skin, tags, button). A swimmer is in trouble beyond the waves off Newcastle Beach. The lifeguard's quad (the kart's physics, its own body
   of simple bodies: MisKit.skin) drives along the esplanade from Turn 2 to the place over the beach (s K.STOP, within K.ZONE m, slower than
   K.VSTOP): PRESEDI NA SKUTER and the lifeguard is at the water's edge on the jet ski (a cut: the road is 15 m over the beach behind its
   wall). The jet ski (MisKit.boat: its own numbers on the sea at 0 m, the camera behind it) goes out through the waves (they lift it:
   K.WAVE m, K.WLEN m apart, coming in at K.WV m/s; white crests drift to the beach). The swimmer shows only now and then on a wave's top
   (every K.SEEN s for K.SHOW s: POMOČ! over it) and is lost again; a red ring on the water is where it was last seen, smaller each time it
   is seen (K.R0 m down to K.RMIN). Beside it (K.PICK m) and slow (K.VPICK), it is pulled onto the rescue sled; back at the beach (K.HOME
   m from where the jet ski set out): done. The swimmer's strength (MOČ PLAVALCA) falls K.TIRE a second (faster in the waves' breaking
   zone); at 0: failed. */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js');
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s), dec = (s) => (typeof Lang !== 'undefined' ? Lang.dec(s) : String(s));
  // the beach (world-newcastle.js: the sea at 0 m): the water's edge E below the stop, the sea outward along N; the swimmer SW off it
  const E = [-96, 606], N = [0.6, 0.8], SW = [-43, 678];
  const K = { S0: 640, STOP: 1000, ZONE: 22, VSTOP: 1.6, WAVE: 0.9, WLEN: 34, WV: 5.5, SEEN: 4.2, SHOW: 1.5, R0: 40, RMIN: 10, PICK: 4.5, VPICK: 2.2, PULL: 1.6, HOME: 14,
    STR0: 0.62, TIRE: 0.0034, DRIFT: 0.35, VMAX: 15 };
  const seaD = (x, z) => (x - E[0]) * N[0] + (z - E[1]) * N[1];   // (metres out from the water's edge)
  const wave = (x, z, t) => { const d = seaD(x, z); if (d < 0) return 0; return K.WAVE * Math.min(1, d / 25) * 0.5 * (1 + Math.sin((d + K.WV * t) / K.WLEN * Math.PI * 2)); };

  // the quad: red, four fat wheels, a rescue board on its rack, the lifeguard on it (yellow, red cap)
  function quad(B) {
    const RD = 0xd8282a, BLK = 0x1b1d21, YEL = 0xf2c230, GRY = 0x9aa1a8;
    B.box(0.05, 0.55, 0, 1.5, 0.35, 0.85, RD); B.box(0.6, 0.72, 0, 0.5, 0.2, 0.95, RD); B.box(-0.6, 0.72, 0, 0.6, 0.2, 0.95, RD);
    B.box(-0.15, 0.82, 0, 0.6, 0.14, 0.4, BLK); B.box(0.55, 0.98, 0, 0.08, 0.08, 0.8, GRY);
    for (const [x, z] of [[0.62, 0.55], [0.62, -0.55], [-0.6, 0.55], [-0.6, -0.55]]) B.cyl(x, 0.32, z, 0.32, 0.28, BLK);
    B.box(-0.65, 0.92, 0, 1.4, 0.06, 0.45, 0xf4f4f4);
    B.box(-0.1, 1.25, 0, 0.32, 0.6, 0.42, YEL); B.box(-0.08, 1.67, 0, 0.22, 0.22, 0.22, 0xd9a77e); B.box(-0.08, 1.8, 0, 0.24, 0.07, 0.24, RD);
  }
  // the jet ski with its rescue sled behind (built in its own frame: x forward), the rider; the swimmer on the sled once picked up
  function jetski(r) {
    if (typeof THREE === 'undefined' || !KIT.parts) return null;
    const B = KIT.parts(), RD = 0xd8282a, WH = 0xf2f4f6, BLK = 0x1b1d21, YEL = 0xf2c230;
    B.box(0, 0.3, 0, 2.8, 0.5, 1.1, WH); B.box(1.5, 0.35, 0, 0.5, 0.35, 0.8, WH); B.box(0, 0.58, 0, 2.2, 0.08, 1.12, RD);
    B.box(-0.3, 0.75, 0, 1.0, 0.25, 0.4, BLK); B.box(0.45, 0.95, 0, 0.12, 0.12, 0.8, 0x50565e);
    B.box(-0.3, 1.25, 0, 0.32, 0.6, 0.42, YEL); B.box(-0.28, 1.67, 0, 0.22, 0.22, 0.22, 0xd9a77e); B.box(-0.28, 1.8, 0, 0.24, 0.07, 0.24, RD);
    B.box(-2.6, 0.2, 0, 1.6, 0.14, 1.0, YEL); B.box(-1.6, 0.25, 0, 0.6, 0.04, 0.04, BLK);
    const g = new THREE.Group(); g.add(B.mesh(new THREE.MeshLambertMaterial({ vertexColors: true })));
    const S = KIT.parts(); S.box(-2.6, 0.38, 0, 1.2, 0.22, 0.4, 0x3a6fd0); S.box(-2.05, 0.42, 0, 0.22, 0.22, 0.22, 0xd9a77e);
    const sw = S.mesh(new THREE.MeshLambertMaterial({ vertexColors: true })); sw.visible = false; g.add(sw); r.onSled = sw;
    return g;
  }

  Missions.add({
    id: '35', title: 'Reševalci na plaži', track: 'newcastle', stars: [110, 150], K,
    story: 'Poletje na plaži. Za valovi je plavalec, ki mu zmanjkuje moči.',
    goal: 'S štirikolesnikom in skuterjem reši plavalca.',
    hint: 'Na robu vode presedi na skuter in pelji do plavalca.',
    rows: [{ k: 'dist', label: 'PLAVALEC' }, { k: 'moc', label: 'MOČ PLAVALCA', bar: true, col: '#e8452c' }, { k: 'val', label: 'VALOVI' }],
    // alone on the closed streets, by day, dry; the quad on the kart's physics (a little slower)
    opts: () => ({ tt: true, laps: 1, playerModel: KIT.truckModel('mravlja', { vLim: 75 }), playerColor: 0xd8282a, damage: 0 }),
    // it starts on the climb before Turn 2, K.STOP - K.S0 m before the place over the beach
    made(race) {
      const T = race.track, c = race.player; if (!c) return;
      const s = (T.startS + K.S0) % T.len, i = T.idx(s);
      c.place(T.px[i], T.pz[i], T.hd[i]); if (T.hasElev) { c.y = c.py = T.hy[i]; c.roadY = c.y; }
      c.dist = s - T.startS; c.q = T.query(T.px[i], T.pz[i], i, {}); c.sPrev = c.q.s;
      while (c.cp < T.cpS.length && c.dist >= T.cpDist[c.cp]) { c.splits.push(0); c.cp++; }
    },
    begin(r) {
      r.stage = 'quad'; r.str = K.STR0; r.sw = { x: SW[0], z: SW[1] }; r.ring = { x: SW[0] + 14, z: SW[1] - 9, R: K.R0 }; r.seenT = 0; r.seen = false; r.pull = 0; r.nSeen = 0;
      r.skin = KIT.skin(r, r.P, quad);
      const mesh = jetski(r);
      r.ski = KIT.boat(r, { x: E[0] + N[0] * 3, z: E[1] + N[1] * 3, h: Math.atan2(N[1], N[0]), y: 0, vmax: K.VMAX, acc: 4.5, turn: 1.5, D: [26, 17], mesh, wave,
        wet: (x, z) => seaD(x, z) > 0.5 && seaD(x, z) < 420 });
      r.tags = KIT.tags(r); r.btn = KIT.button(r, 'PRESEDI NA SKUTER');
      if (typeof THREE !== 'undefined') {
        // the swimmer (a head and arms over the water, an orange cap), the red ring where it was last seen, the white crests of the waves
        const sw = new THREE.Group(), m = new THREE.MeshLambertMaterial({ color: 0xd9a77e });
        const h = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshLambertMaterial({ color: 0xff7a00 })); h.position.y = 0.25; sw.add(h);
        const a = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, 0.12), m); a.position.set(0, 0.55, 0.3); a.rotation.x = -0.4; sw.add(a);
        sw.visible = false; r.swM = sw; r.add(sw);
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 40), new THREE.MeshBasicMaterial({ color: 0xff3030, transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false }));
        ring.rotation.x = -Math.PI / 2; ring.renderOrder = 2; r.ringM = ring; r.add(ring);
        const cg = new THREE.BoxGeometry(1, 0.12, 1.4), crest = new THREE.InstancedMesh(cg, new THREE.MeshBasicMaterial({ color: 0xf4f8fa, transparent: true, opacity: 0.85 }), 6); crest.frustumCulled = false; r.crest = crest; r.add(crest);
        r._m = new THREE.Matrix4(); r._q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.atan2(N[1], N[0])); r._v = new THREE.Vector3(); r._s = new THREE.Vector3(1, 1, 1);
        // the lifeguards' tower on the beach by the water's edge
        const B = KIT.parts(); for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) B.box(x, 1.6, z, 0.18, 3.2, 0.18, 0xe8eaee);
        B.box(0, 4.0, 0, 2.6, 1.8, 2.6, 0xc4301c); B.box(0, 5.1, 0, 3.0, 0.3, 3.0, 0xeeeeee); B.box(1.32, 4.1, 0, 0.04, 0.8, 1.8, 0x1d2733);
        const tw = B.mesh(new THREE.MeshLambertMaterial({ vertexColors: true })); tw.position.set(E[0] - N[0] * 14 - N[1] * 16, 3.4, E[1] - N[1] * 14 + N[0] * 16); tw.rotation.y = -Math.atan2(N[1], N[0]); r.add(tw);
      }
      this.show(r);
    },
    step(r, dt) {
      const P = r.P, T = r.race.track, s = P.q ? P.q.s : 0, v = Math.hypot(P.vx || 0, P.vz || 0), S = r.ski;
      // the swimmer tires (faster in the breaking waves) and drifts toward the rocks, slowly
      if (r.stage !== 'done' && r.stage !== 'sled') r.str -= K.TIRE * dt * (1 + 0.5 * Math.max(0, Math.sin(r.t * 0.7)));
      if (r.stage === 'sled') r.str = Math.max(r.str, 0.05);
      if (r.str <= 0) { r.str = 0; r.fail(tr('Plavalcu je zmanjkalo moči.')); }
      if (r.stage !== 'sled' && r.stage !== 'done') { r.sw.x -= N[1] * K.DRIFT * dt * 0.4; r.sw.z += N[0] * K.DRIFT * dt * 0.4; }
      // seen on a wave's top, now and then: the ring closes in round it
      r.seenT += dt; const was = r.seen; r.seen = r.stage !== 'sled' && r.stage !== 'done' && (r.seenT % K.SEEN) > K.SEEN - K.SHOW;
      if (r.seen && !was) { r.nSeen++; r.ring.R = Math.max(K.RMIN, r.ring.R * 0.75); const a = r.nSeen * 2.3, k = r.ring.R * 0.35; r.ring.x = r.sw.x + Math.cos(a) * k; r.ring.z = r.sw.z + Math.sin(a) * k; }
      if (r.stage === 'quad') {
        const inZ = Math.abs(s - K.STOP) < K.ZONE;
        if (inZ && v < 6) { const f = Math.exp(-dt * 2.5); P.vx *= f; P.vz *= f; }
        const can = inZ && v < K.VSTOP; r.btn.show(can);
        if (can && (r.btn.take() || r.autoSki)) { r.stage = 'ski'; r.btn.show(false); S.go(true); r.autoSki = false; }
        r.say(can ? 'Presedi na skuter!' : inZ ? 'Ustavi nad plažo.' : s > K.STOP + K.ZONE ? 'Plažo si zgrešil: vrni se nazaj.' : tr('Do plaže: {0} m', Math.max(0, Math.round(K.STOP - s))));
        P.wrongT = 0; if (inZ) P.stuckT = 0;
      } else {
        // the player's controls (set by the game before the race's step) steer the jet ski; the quad stays parked
        const I = r.autoIn || [P.inSteer || 0, P.inThr || 0, P.inBrk || 0];
        KIT.hold(P);
        S.step(dt, I[0], I[1], I[2]);
        const dSw = Math.hypot(r.sw.x - S.x, r.sw.z - S.z);
        if (r.stage === 'ski') {
          if (dSw < K.PICK && S.speed < K.VPICK) { r.pull += dt; if (r.pull >= K.PULL) { r.stage = 'sled'; if (r.onSled) r.onSled.visible = true; } } else r.pull = 0;
          r.say(dSw < K.PICK * 2 ? (S.speed < K.VPICK ? 'Plavalca vlečeš na sani …' : 'Ustavi ob plavalcu.') : r.seen ? 'Plavalec je na valu: pelji tja!' : 'Pelji do rdečega kroga; plavalec se pokaže na vrhu vala.');
        } else if (r.stage === 'sled') {
          const home = Math.hypot(S.x - (E[0] + N[0] * 3), S.z - (E[1] + N[1] * 3));
          r.home = home;
          if (home < K.HOME) { r.stage = 'done'; S.go(false); r.win(); }
          r.say('Plavalec je na saneh: pelji nazaj na obalo.');
        }
      }
      // the swimmer, the ring, the crests drawn; the tags
      const st = r.t;
      if (r.swM) { r.swM.visible = r.seen || (r.stage === 'ski' && Math.hypot(r.sw.x - S.x, r.sw.z - S.z) < 12); r.swM.position.set(r.sw.x, wave(r.sw.x, r.sw.z, st) - 0.2, r.sw.z); }
      if (r.ringM) { r.ringM.visible = r.stage === 'quad' || r.stage === 'ski'; r.ringM.position.set(r.ring.x, 0.25, r.ring.z); r.ringM.scale.set(r.ring.R, r.ring.R, 1); }
      if (r.crest) { for (let k = 0; k < 6; k++) { const ph = ((st * K.WV) / K.WLEN + k) % 6, d = 200 - ph * K.WLEN; r._v.set(E[0] + N[0] * (d + K.WLEN * 0.25), Math.max(0.05, wave(E[0] + N[0] * d, E[1] + N[1] * d, st) + 0.05), E[1] + N[1] * (d + K.WLEN * 0.25)); r._s.set(1.6, 1, Math.max(0, d) > 4 ? 140 : 0.01); r._m.compose(r._v, r._q, r._s); r.crest.setMatrixAt(k, r._m); } r.crest.instanceMatrix.needsUpdate = true; }
      const tg = [];
      if (r.seen) tg.push({ x: r.sw.x, y: 2.6, z: r.sw.z, cls: 'go', html: '<b>' + tr('POMOČ!') + '</b>' });
      else if (r.stage === 'ski' || r.stage === 'quad') tg.push({ x: r.ring.x, y: 3, z: r.ring.z, html: '<b>' + tr('ZADNJIČ VIDEN') + '</b>' + tr('krog iskanja {0} m', Math.round(r.ring.R)) });
      if (r.stage === 'sled') tg.push({ x: E[0], y: 4, z: E[1], cls: 'go', html: '<b>' + tr('OBALA') + '</b>' });
      r.tags.set(tg);
      this.show(r);
    },
    // past the beach round the lap to the finish line: not done
    finish(r) { if (r.stage !== 'done') r.fail(tr('Zapeljal si mimo plaže.')); },
    show(r) {
      const S = r.ski, x = r.stage === 'quad' ? null : S;
      const d = r.stage === 'sled' || r.stage === 'done' ? r.home : x ? Math.hypot(r.sw.x - x.x, r.sw.z - x.z) : Math.hypot(r.sw.x - E[0], r.sw.z - E[1]) + 80;
      r.set('dist', r.stage === 'sled' || r.stage === 'done' ? tr('na saneh') : '~' + Math.round(d / 5) * 5 + ' m');
      const f = Math.max(0, r.str);
      r.set('moc', Math.round(f * 100) + ' %', f, f > 0.5 ? '#3fbf6a' : f > 0.25 ? '#ffb020' : '#e8452c');
      r.set('val', dec((K.WAVE * 2).toFixed(1)) + ' m');
    },
  });
})();
