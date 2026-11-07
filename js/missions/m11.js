/* Special mission 11 · Ognjena reka · Mauna Kea, ZDA (js/missions.js; the kit: js/missions/kit.js). A neighbouring volcano has erupted:
   its glow and its plume over the horizon ahead, glowing stones falling out of the sky, ash. The researchers are in the 4x4 (MEDVED 4x4)
   by the domes at the top (K.TOP m below the finish line, facing down the road: MisKit.place back, the wrong way allowed); the valley is the
   start line (the end of the asphalt, the gravel on to the visitor station). Lower down three lava flows creep over the road (K.D m down from
   the top, each from its own side K.SIDE): from K.FLOW s before its time K.C a flow covers the road from its side, at K.C only K.GAP m are
   left on the other (the crossing closed: a crossing closed ahead of the car is failed). PREHODI ODPRTI: the crossings not closed yet;
   ZAPRE SE: the time left of the next one ahead and the way to it. In the lava the car is slowed and burns (AVTO down K.BURN a second).
   A glowing stone: a red circle K.RHIT m round where it will land (on the way ahead, where the car would be in K.WARN s, a little to the
   side; none within K.CLEAR m of a flow over the road), K.WARN s later it lands: the car in the circle loses K.ROCK of AVTO and is
   shaken. AVTO at 0: failed. PEPEL: the ash, thicker as
   the time goes by (the flakes round the camera). At the start line: done. */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js');
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s), dec = (s) => (typeof Lang !== 'undefined' && Lang.dec ? Lang.dec(s) : String(s).replace('.', ','));
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  // a tag's place for MisKit.tags: one farther than half the camera's reach pulled in along the line of sight (the same spot on the
  // screen; past the far plane a tag is not shown, and the reach is shorter on a slow phone)
  const reach = (C, x, y, z) => { if (!C) return { x, y, z }; const dx = x - C.position.x, dy = y - C.position.y, dz = z - C.position.z, d = Math.hypot(dx, dy, dz), m = 0.5 * (C.far || 400); if (d <= m) return { x, y, z }; const k = m / d; return { x: C.position.x + dx * k, y: C.position.y + dy * k, z: C.position.z + dz * k }; };
  const K = { TOP: 30, END: 0, D: [2500, 3800, 5000], SIDE: [1, -1, 1], C: [200, 285, 370], FLOW: 90, PRE: 40, LEN: 18, GAP: 2.6, HALF: 1.0,
    BURN: 0.45, DRAG: 1.6, R0: 12, EVERY: [3.2, 5.5], WARN: 2.2, RHIT: 2.5, SPREAD: 3, NEAR: 16, CLEAR: 45, ROCK: 0.2, LIE: 5, MAXR: 4, ASH: 360, FAR: 45 };
  const has3 = () => typeof THREE !== 'undefined' && typeof Render !== 'undefined' && !!Render.scene;

  // the lava's look: dark crust in plates, glowing cracks between them (a small canvas, repeated)
  function lavaTex() {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    g.fillStyle = '#ff6a10'; g.fillRect(0, 0, 128, 128);
    let sd = 7; const rnd = () => ((sd = (sd * 16807) % 2147483647) - 1) / 2147483646;
    for (let k = 0; k < 26; k++) {
      const x = rnd() * 128, y = rnd() * 128, r = 9 + rnd() * 14;
      for (const [ox, oy] of [[0, 0], [128, 0], [-128, 0], [0, 128], [0, -128]]) {
        g.fillStyle = k % 3 ? '#2a1712' : '#3b1d12'; g.beginPath();
        for (let a = 0; a < 7; a++) { const t = a / 7 * 6.283, q = r * (0.75 + 0.25 * Math.sin(a * 2.1 + k)); g.lineTo(x + ox + Math.cos(t) * q, y + oy + Math.sin(t) * q); }
        g.closePath(); g.fill();
      }
    }
    const T = new THREE.CanvasTexture(c); T.wrapS = T.wrapT = THREE.RepeatWrapping; return T;
  }

  Missions.add({
    id: '11', title: 'Ognjena reka', track: 'maunakea', car: 'medved', stars: [310, 350], K,
    story: 'Sosednji vulkan je izbruhnil. Lava teče čez cesto pod goro, z neba padajo žareči kamni.',
    goal: 'Pripelji raziskovalce z observatorija v dolino, preden lava zapre zadnji prehod.',
    hint: 'Rdeči krog pomeni, da tja pade žareč kamen.',
    rows: [{ k: 'prehodi', label: 'PREHODI ODPRTI' }, { k: 'zapre', label: 'ZAPRE SE', bar: true, col: '#ff7a1a' }, { k: 'pepel', label: 'PEPEL', bar: true, col: '#9aa0a6' }, { k: 'avto', label: 'AVTO', bar: true }],
    // alone on the closed road, the 4x4 (MEDVED 4x4), at dusk
    opts: () => ({ tt: true, playerColor: 0xe9e4d6 }),
    // the 4x4 by the domes, K.TOP m below the finish line, facing down the road
    made(race) { const T = race.track, c = race.player; if (c) KIT.place(c, T, T.finishS - K.TOP, true); },
    begin(r) {
      const T = r.race.track;
      r.top = T.finishS - K.TOP; r.sEnd = T.startS + K.END; r.hp = 1; r.ash = 0; r.hitT = 0; r.inLava = false; r.burnt = 0; r.hits = 0;
      r.cx = K.D.map((d, k) => { const s = r.top - d; return { k, s, w: T.wS(s), side: K.SIDE[k], a: K.C[k] - K.FLOW, c: K.C[k], f: 0, e: 0, passed: false, closed: false }; });
      r.rocks = []; r.seed = 11; r.nextRock = K.R0;
      KIT.backRoad(r);
      if (typeof Render !== 'undefined' && Render.setAtmos) Render.setAtmos({ season: 'summer', tod: 'dusk' }, true);
      if (has3()) this.build(r);
      this.flows(r, 0); this.show(r);
    },
    rnd(r) { r.seed = (r.seed * 16807) % 2147483647; return (r.seed - 1) / 2147483646; },
    // each flow's front: e, its offset from the centre line toward its own side (the lava from there out); before its time it comes down
    // the slope toward the road (K.PRE s, from K.FAR m off), from K.C - K.FLOW over the road until K.GAP m are left at K.C
    flows(r) {
      for (const c of r.cx) {
        c.f = clamp((r.t - c.a) / (c.c - c.a), 0, 1);
        const pre = clamp((r.t - (c.a - K.PRE)) / K.PRE, 0, 1);
        c.e = c.f > 0 ? c.w - c.f * (2 * c.w - K.GAP) : c.w + (K.FAR - c.w) * (1 - pre);
        if (c.f >= 1) c.closed = true;
      }
    },
    step(r, dt) {
      const P = r.P, T = r.race.track, q = P.q; if (!q) return;
      P.wrongT = 0;   // (down the road made to be driven up)
      this.flows(r);
      // the crossings: passed (the car below its lava), closed ahead of the car: failed; in the lava: slowed, burning
      r.inLava = false;
      for (const c of r.cx) {
        if (!c.passed && q.s < c.s - K.LEN / 2) c.passed = true;
        if (c.closed && !c.passed) { this.show(r); r.fail(tr('Lava je zaprla cesto pred tabo.')); return; }
        if (Math.abs(q.s - c.s) < K.LEN / 2 && c.side * (q.d || 0) + K.HALF > c.e) r.inLava = true;
      }
      if (r.inLava) { r.hp -= K.BURN * dt; r.burnt += dt; const k = Math.max(0, 1 - K.DRAG * dt); P.vx *= k; P.vz *= k; }
      // the stones: a circle on the way ahead, the stone in it K.WARN s later
      const i = T.idx(q.s), vs = (P.vx || 0) * T.tx[i] + (P.vz || 0) * T.tz[i];
      if (r.t >= r.nextRock && q.s > r.sEnd + 120) {
        let ds = vs * K.WARN; if (Math.abs(ds) < K.NEAR) ds = vs > 0.5 ? K.NEAR : -K.NEAR;
        const s = q.s + ds, w = T.wS(s), d = clamp((q.d || 0) + (this.rnd(r) * 2 - 1) * K.SPREAD, -(w - 1), w - 1), p = KIT.at(T, s, d);
        if (r.cx.some(c => c.f > 0 && Math.abs(s - c.s) < K.LEN / 2 + K.CLEAR)) r.nextRock = r.t + 1;   // (none in a flow's gap: no room there to go round it)
        else {
          r.rocks.push({ s, d, x: p.x, z: p.z, y: Math.max(p.y, p.ty), t0: r.t, land: r.t + K.WARN, done: false, hit: false });
          r.nextRock = r.t + K.EVERY[0] + this.rnd(r) * (K.EVERY[1] - K.EVERY[0]);
        }
      }
      for (const k of r.rocks) if (!k.done && r.t >= k.land) {
        k.done = true;
        if (Math.hypot((P.x || 0) - k.x, (P.z || 0) - k.z) < K.RHIT) { k.hit = true; r.hits++; r.hp -= K.ROCK; r.hitT = 1.5; P.vx *= 0.55; P.vz *= 0.55; }
      }
      r.rocks = r.rocks.filter(k => r.t < k.land + K.LIE);
      if (r.hitT > 0) r.hitT -= dt;
      r.ash = Math.min(1, r.t / K.ASH);
      if (r.hp <= 0) { r.hp = 0; this.show(r); r.fail(r.inLava ? tr('Avto je obtičal v lavi.') : tr('Žareči kamni so uničili avto.')); return; }
      if (q.s <= r.sEnd) { this.show(r); r.win(); return; }
      // the hint: hit, in the lava, a circle near, the open side of the next flow
      const nx = this.next(r), near = r.rocks.find(k => !k.done && Math.hypot((P.x || 0) - k.x, (P.z || 0) - k.z) < 45);
      let side = '';
      if (nx && nx.f > 0 && q.s - nx.s < 400) { const j = T.idx(nx.s), ox = -nx.side * T.nx[j], oz = -nx.side * T.nz[j]; side = ox * -Math.sin(P.h || 0) + oz * Math.cos(P.h || 0) > 0 ? 'desno' : 'levo'; }
      r.say(r.hitT > 0 ? 'Zadel te je žareč kamen!' : r.inLava ? 'Lava! Zapelji na drugo stran ceste.' : near ? 'Umakni se iz rdečega kroga!'
        : side === 'desno' ? 'Lava se širi čez cesto: pelji ob desnem robu.' : side === 'levo' ? 'Lava se širi čez cesto: pelji ob levem robu.' : this.hint);
      if (r.fx) this.draw(r, dt);
      this.show(r);
    },
    // the next crossing down the road (not passed yet)
    next(r) { return r.cx.find(c => !c.passed) || null; },
    // driven up to the summit instead: not the valley
    finish(r) { r.fail(tr('Raziskovalce moraš pripeljati v dolino.')); },
    show(r) {
      const q = r.P.q, open = r.cx.filter(c => !c.closed).length;
      r.set('prehodi', open + ' / ' + r.cx.length, null, open < r.cx.length ? '#ffb020' : null);
      const nx = this.next(r);
      if (nx) { const left = Math.max(0, nx.c - r.t), way = q ? Math.max(0, q.s - nx.s) : 0; r.set('zapre', Missions.clock(left) + ' · ' + dec((way / 1000).toFixed(1)) + ' km', Math.min(1, left / K.FLOW), left < 20 ? '#e8452c' : '#ff7a1a'); }
      else r.set('zapre', '—', 0);
      r.set('pepel', Math.round(r.ash * 100) + ' %', r.ash);
      r.set('avto', Math.round(Math.max(0, r.hp) * 100) + ' %', Math.max(0, r.hp), r.hp > 0.5 ? '#3fbf6a' : r.hp > 0.25 ? '#ffb020' : '#e8452c');
    },
    // the tests' and the pictures' driver: down the road, out of the circles, on the open side of a flow
    pilot(r, o) {
      const P = r.P, T = r.race.track, q = P.q, d0 = q ? q.d || 0 : 0, w = q ? T.wS(q.s) - 0.9 : 4;
      // the room: the road, less the lava of the next flow when it is near (its open side only)
      let lo = -w, hi = w, off = 0;
      const nx = this.next(r);
      if (nx && q && q.s - nx.s < 260) {
        const e = nx.e - K.HALF - 0.4;   // (the car's centre at most here toward the flow's side)
        if (nx.side > 0) hi = Math.min(hi, e); else lo = Math.max(lo, -e);
        off = nx.side > 0 ? Math.max(lo, Math.min(hi, -w + 1.2)) : Math.min(hi, Math.max(lo, w - 1.2));
      }
      // round a circle ahead: to the side of it that is in the room and nearer the car (else the one farther from it)
      for (const k of r.rocks) if (!k.done && q && Math.abs(q.s - k.s) < 70) {
        const a = clamp(k.d - K.RHIT - 1.6, lo, hi), b = clamp(k.d + K.RHIT + 1.6, lo, hi), da = Math.abs(a - k.d), db = Math.abs(b - k.d), ok = K.RHIT + 1.0;
        off = da >= ok && (db < ok || Math.abs(a - d0) < Math.abs(b - d0)) ? a : db >= ok ? b : da > db ? a : b;
      }
      return KIT.pilot(P, T, Object.assign({ dir: -1, v: 21, lat: 4, off: clamp(off, lo, hi), look: 2 }, o));
    },

    /* ---------------- the look: the flows, the stones, the volcano over the horizon, the ash ---------------- */
    build(r) {
      const T = r.race.track, fx = r.fx = { lava: [], tex: lavaTex() };
      const mat = new THREE.MeshBasicMaterial({ map: fx.tex, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
      for (const c of r.cx) {   // (a grid over the road and the slope: NA along the road, NL across, moved with its front)
        const NA = 7, NL = 12, G = new THREE.BufferGeometry(), pos = new Float32Array(NA * NL * 3), uv = new Float32Array(NA * NL * 2), idx = [];
        for (let a = 0; a < NA - 1; a++) for (let l = 0; l < NL - 1; l++) { const v = a * NL + l; idx.push(v, v + NL, v + 1, v + 1, v + NL, v + NL + 1); }
        G.setAttribute('position', new THREE.BufferAttribute(pos, 3)); G.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); G.setIndex(idx);
        const m = new THREE.Mesh(G, mat); m.frustumCulled = false; r.add(m);
        fx.lava.push({ c, m, G, pos, uv, NA, NL, last: null });
      }
      fx.fire = KIT.fire(r, r.cx.length * 4 + K.MAXR, { per: 5, spread: 1.4 });
      fx.volc = KIT.fire(r, 3, { per: 8, spread: 0.7 });
      // the stones: a glowing body each and its red circle on the road
      fx.rock = []; const rg = new THREE.IcosahedronGeometry(0.75, 0), ring = new THREE.RingGeometry(K.RHIT - 0.35, K.RHIT, 32);
      for (let k = 0; k < K.MAXR; k++) {
        const b = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ color: 0xff7a22 })); b.visible = false; r.add(b);
        const c = new THREE.Mesh(ring, new THREE.MeshBasicMaterial({ color: 0xff2a1a, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 }));
        c.rotation.x = -Math.PI / 2; c.visible = false; c.renderOrder = 2; r.add(c);
        fx.rock.push({ b, c });
      }
      // the ash: grey flakes falling round the camera (one draw)
      const NAs = 260, ap = new Float32Array(NAs * 3);
      for (let k = 0; k < NAs; k++) { ap[k * 3] = (this.rnd(r) - 0.5) * 50; ap[k * 3 + 1] = this.rnd(r) * 22; ap[k * 3 + 2] = (this.rnd(r) - 0.5) * 50; }
      const AG = new THREE.BufferGeometry(); AG.setAttribute('position', new THREE.BufferAttribute(ap, 3));
      fx.ash = new THREE.Points(AG, new THREE.PointsMaterial({ color: 0x4e4b48, size: 0.14, transparent: true, opacity: 0.2, depthWrite: false }));
      fx.ash.frustumCulled = false; fx.ashP = ap; r.add(fx.ash);
      // the volcano: over the horizon ahead and to the right (south of the summit: where Mauna Loa is), drawn at a fixed distance from the camera
      const j = T.idx(T.startS), tq = T.idx(r.top);
      fx.vdir = Math.atan2(T.pz[j] - T.pz[tq], T.px[j] - T.px[tq]) + 0.35;
      r.tags = KIT.tags(r);
    },
    draw(r, dt) {
      const T = r.race.track, fx = r.fx, P = r.P, C = Render.camera;
      fx.tex.offset.y = (fx.tex.offset.y - dt * 0.035) % 1;   // (the crust creeps toward the front)
      // the flows: the grid from the front out to K.FAR m off the road, on the road at its own height, beyond on the ground
      let fi = 0;
      for (const L of fx.lava) {
        const c = L.c, near = Math.abs((P.q ? P.q.s : 0) - c.s) < 900;
        L.m.visible = near;
        if (near) {
          const key = c.e.toFixed(2);
          if (key !== L.last) {
            L.last = key;
            for (let a = 0; a < L.NA; a++) {
              const s = c.s - K.LEN / 2 + K.LEN * a / (L.NA - 1), w = T.wS(s), i = T.idx(s), wob = 0.5 * Math.sin(a * 1.7 + c.k * 2.3), e0 = c.e + wob;
              for (let l = 0; l < L.NL; l++) {
                const u = Math.pow(l / (L.NL - 1), 1.6), e = e0 + (K.FAR + 15 - e0) * u, p = KIT.at(T, s, c.side * e);
                const y = Math.abs(e) <= w + 0.5 && T.hasElev ? T.hy[i] + 0.06 : (Number.isFinite(p.y) ? p.y : p.ty) + 0.1, v = a * L.NL + l;
                L.pos[v * 3] = p.x; L.pos[v * 3 + 1] = y + (1 - u) * 0.12; L.pos[v * 3 + 2] = p.z; L.uv[v * 2] = a / (L.NA - 1) * 1.4; L.uv[v * 2 + 1] = (e - c.e) / 14;
              }
            }
            L.G.attributes.position.needsUpdate = L.G.attributes.uv.needsUpdate = true; L.G.computeBoundingSphere();
          }
        }
        for (let k = 0; k < 4; k++) {   // (the flames along the front)
          const s = c.s - 6 + 4 * k, p = KIT.at(T, s, c.side * (c.e + 0.4)), i = T.idx(s);
          fx.fire.spot(fi++, p.x, (Math.abs(c.e) <= c.w + 0.5 && T.hasElev ? T.hy[i] : p.y) + 0.2, p.z, near ? 1.6 + 0.5 * (k % 2) : 0);
        }
      }
      // the stones: falling the last K.WARN s on a slant out of the sky, glowing, then lying K.LIE s cooling; their circles until they land
      for (let k = 0; k < K.MAXR; k++) {
        const R = fx.rock[k], o = r.rocks[k];
        if (!o) { R.b.visible = R.c.visible = false; fx.fire.spot(fi++, 0, 0, 0, 0); continue; }
        const u = clamp((r.t - o.t0) / K.WARN, 0, 1), h = (1 - u) * (1 - u) * 70;
        R.c.visible = !o.done; R.c.position.set(o.x, o.y + 0.07, o.z); R.c.material.opacity = 0.55 + 0.4 * Math.abs(Math.sin(r.t * 9));
        R.b.visible = true; R.b.position.set(o.x - (1 - u) * 26, o.y + 0.5 + h, o.z + (1 - u) * 14); R.b.rotation.set(r.t * 3, r.t * 2, 0);
        const cool = o.done ? clamp((r.t - o.land) / K.LIE, 0, 1) : 0; R.b.material.color.setRGB(1 - 0.75 * cool, 0.48 - 0.38 * cool, 0.13 - 0.06 * cool);
        fx.fire.spot(fi++, R.b.position.x, R.b.position.y, R.b.position.z, o.done ? 1.3 * (1 - cool) : 1.6);
      }
      fx.fire.step(dt);
      // the volcano at 600 m from the camera on its bearing, over the horizon: its fountain and its plume
      if (C) {
        const a = fx.vdir, x = C.position.x + Math.cos(a) * 600, z = C.position.z + Math.sin(a) * 600, y = C.position.y + 26;
        fx.volc.spot(0, x, y, z, 26); fx.volc.spot(1, x + 6, y - 4, z + 3, 18); fx.volc.spot(2, x - 7, y - 5, z - 2, 16); fx.volc.step(dt);
        // the ash round the camera, falling and drifting
        const A = fx.ashP; fx.ash.position.set(C.position.x, C.position.y - 8, C.position.z);
        for (let k = 0; k < A.length; k += 3) { A[k + 1] -= dt * 1.3; A[k] += dt * 0.6; if (A[k + 1] < 0) A[k + 1] += 22; if (A[k] > 25) A[k] -= 50; }
        fx.ash.geometry.attributes.position.needsUpdate = true; fx.ash.material.opacity = 0.15 + 0.7 * r.ash;
      }
      // the tags over the flows ahead: their time left
      // (a flow past the camera's far plane: its tag pulled nearer along the same line of sight, else it would not be shown)
      if (r.tags) r.tags.set(r.cx.filter(c => !c.passed && P.q && P.q.s - c.s < 1500).map(c => { const p = KIT.at(T, c.s, 0); return Object.assign(reach(C, p.x, p.ty + 6, p.z), { html: '<b>' + tr('LAVA') + '</b>' + Missions.clock(Math.max(0, c.c - r.t)), cls: 'hot' }); }));
    },
  });
})();
