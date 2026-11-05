/* Special mission 23 · Lovec na meteorite · Marrakesh, Maroko (js/missions.js; the kit: js/missions/kit.js). At night a meteor shower
   falls over the city's closed street circuit: shooting stars over the sky, and K.N stones that reach the ground, one every K.EVERY s from
   K.T0 s (NASLEDNJI UDAR). Each falls K.AHEAD m ahead of the 4x4 (MEDVED 4x4) on the road, somewhere across it; a yellow ring shows where,
   K.WARN s before it lands. Landed: a crater and the stone in it glowing, too hot to touch for K.COOL s (its tag: its temperature).
   Cooled, it is picked up by stopping at it (within K.PICK m, under K.VSTOP m/s): METEORITI. K.R rival hunters in their own 4x4s drive the
   circuit slower (K.RV km/h at most) and take a cooled stone they drive past within K.RPICK m (TEKMECI: how many, and how far the nearest
   is behind the stone nearest the 4x4: they come closer while it cools). K.NEED stones:
   done; fewer left in the sky and on the ground than still needed: failed. The tags over the stones and the rings, pinned to the screen's
   edge when out of sight, are the radar. */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js');
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  // a tag's place for MisKit.tags: one farther than half the camera's reach pulled in along the line of sight (the same spot on the
  // screen; past the far plane a tag is not shown, and the reach is shorter on a slow phone)
  const reach = (C, x, y, z) => { if (!C) return { x, y, z }; const dx = x - C.position.x, dy = y - C.position.y, dz = z - C.position.z, d = Math.hypot(dx, dy, dz), m = 0.5 * (C.far || 400); if (d <= m) return { x, y, z }; const k = m / d; return { x: C.position.x + dx * k, y: C.position.y + dy * k, z: C.position.z + dz * k }; };
  const K = { N: 12, NEED: 8, T0: 8, EVERY: 17, AHEAD: [200, 480], WARN: 6, COOL: 10, HOT: 900, PICK: 4.5, VSTOP: 2.5, R: 3, RS: [700, 1450, 2200], RV: 60, RCAP: 0.7, RPICK: 6, MAXS: 12 };
  const has3 = () => typeof THREE !== 'undefined' && typeof Render !== 'undefined' && !!Render.scene;
  const COLS = [0x3d6e3a, 0x8a5a2b, 0x2f4f7a];

  // a car put at s, lat m off the centre line (made: before the race is drawn), its checkpoints and lap as if driven there
  function put(c, T, s, lat) {
    const i = T.idx(s), x = T.px[i] + T.nx[i] * lat, z = T.pz[i] + T.nz[i] * lat;
    c.place(x, z, T.hd[i]); if (T.hasElev) { c.y = c.py = T.hy[i]; c.roadY = c.y; }
    c.dist = s - T.startS; c.lap = 0; c.cp = 0; c.splits = []; c.q = T.query(x, z, i, {}); c.sPrev = c.q.s;
    while (c.cp < T.cpS.length && c.dist >= T.cpDist[c.cp]) { c.splits.push(0); c.cp++; }
  }

  Missions.add({
    id: '23', title: 'Lovec na meteorite', track: 'marrakesh', car: 'medved', stars: [165, 210], K,
    story: 'Nocoj nad puščavo pada meteorski dež. Nekateri kamni priletijo do tal še žareči.',
    goal: 'S terencem poišči in poberi osem meteoritov, preden jih najdejo drugi lovci. Krogi pokažejo, kam bo padlo.',
    hint: 'Žareč kamen je prevroč: počakaj, da se ohladi.',
    rows: [{ k: 'met', label: 'METEORITI', bar: true, col: '#ffd34d' }, { k: 'udar', label: 'NASLEDNJI UDAR' }, { k: 'tek', label: 'TEKMECI' }],
    // the circuit closed, at night, K.R rival hunters; laps enough that nobody finishes
    opts: () => ({ tt: false, numAI: K.R, laps: 99, flying: 0, damage: 0, playerColor: 0xd9b26a }),
    // the rivals: hunters in 4x4s (MEDVED 4x4) spread round the circuit ahead, at a slower pace
    made(race) {
      const T = race.track, M = KIT.truckModel('medved', { vLim: K.RV }); let k = 0;
      race.cars.forEach((o, j) => {
        if (o.isPlayer || !M || k >= K.R) return;
        const c = new Core.Car(M, { id: o.id, name: tr('LOVEC') + ' ' + (k + 1), color: COLS[k % COLS.length], skill: 0.95, assist: Core.CSK.aiAssist, phys: race.opts.phys });
        c.grid = o.grid; c.num = o.num; c.dmgMode = 0; c.locked = o.locked; c.laneBias = 0; c.skCap = K.RCAP; c.rubber = 1; c.hunter = true;
        put(c, T, T.startS + K.RS[k], (k % 2 ? 1 : -1) * 1.5);
        race.cars[j] = c; k++;
      });
    },
    begin(r) {
      r.got = 0; r.lost = 0; r.fell = 0; r.stones = []; r.seed = 23; r.nextT = K.T0; r.pickT = 0;
      if (typeof Render !== 'undefined' && Render.setAtmos) Render.setAtmos({ season: 'summer', tod: 'night' }, true);
      if (has3()) this.build(r);
      this.show(r);
    },
    rnd(r) { r.seed = (r.seed * 16807) % 2147483647; return (r.seed - 1) / 2147483646; },
    step(r, dt) {
      const P = r.P, T = r.race.track, q = P.q; if (!q) return;
      P.wrongT = 0; P.stuckT = 0;   // (stopping at a stone, turning back for one)
      // the next stone: its ring K.WARN s before it lands, ahead of the player on the road
      if (r.fell < K.N && r.t >= r.nextT - K.WARN && !r.stones.some(o => o.state === 'ring')) {
        const L = T.len, s = ((q.s + K.AHEAD[0] + this.rnd(r) * (K.AHEAD[1] - K.AHEAD[0])) % L + L) % L, w = T.wS(s), d = (this.rnd(r) * 2 - 1) * Math.max(0, w - 1.6), p = KIT.at(T, s, d);
        r.stones.push({ n: r.fell + 1, s, d, x: p.x, z: p.z, y: Math.max(p.y, p.ty), land: r.nextT, state: 'ring', heat: 1 });
        r.fell++; r.nextT += K.EVERY;
      }
      const v = Math.hypot(P.vx || 0, P.vz || 0);
      let hot = false;
      for (const o of r.stones) {
        if (o.state === 'ring' && r.t >= o.land) { o.state = 'hot'; o.heat = 1; }
        if (o.state === 'hot') { o.heat = Math.max(0, 1 - (r.t - o.land) / K.COOL); if (o.heat <= 0) o.state = 'cool'; }
        if (o.state === 'hot' || o.state === 'cool') {
          const dP = Math.hypot((P.x || 0) - o.x, (P.z || 0) - o.z);
          if (dP < K.PICK && v < K.VSTOP) { if (o.state === 'cool') { o.state = 'got'; r.got++; r.pickT = 2; } else hot = true; }
        }
        if (o.state === 'cool') for (const c of r.race.cars) if (c.hunter && Math.hypot(c.x - o.x, c.z - o.z) < K.RPICK) { o.state = 'rival'; r.lost++; r.rivalT = 2.5; break; }
      }
      if (r.pickT > 0) r.pickT -= dt; if (r.rivalT > 0) r.rivalT -= dt;
      r.hot = hot;
      if (r.got >= K.NEED) { this.show(r); r.win(); return; }
      const left = r.got + r.stones.filter(o => o.state === 'ring' || o.state === 'hot' || o.state === 'cool').length + (K.N - r.fell);
      if (left < K.NEED) { this.show(r); r.fail(tr('Tekmeci so pobrali preveč meteoritov.')); return; }
      const ring = r.stones.find(o => o.state === 'ring');
      r.say(r.pickT > 0 ? 'Meteorit je tvoj!' : r.rivalT > 0 ? 'Tekmec je pobral meteorit!' : hot ? this.hint
        : ring && r.t > ring.land - 3 ? 'Pazi, udar! Meteorit pada v rumeni krog.' : r.stones.some(o => o.state === 'cool') ? 'Ustavi se ob ohlajenem meteoritu in ga poberi.' : 'Krog pokaže, kam bo padel meteorit.');
      if (r.fx) this.draw(r, dt);
      this.show(r);
    },
    // the circuit has no finish for the hunt (laps: 99)
    finish() {},
    show(r) {
      r.set('met', r.got + ' / ' + K.NEED, r.got / K.NEED);
      const nx = r.fell < K.N ? Math.max(0, r.nextT - r.t) : null, ring = r.stones.find(o => o.state === 'ring');
      const t = ring ? Math.max(0, ring.land - r.t) : nx;
      r.set('udar', t == null ? '—' : Missions.clock(Math.ceil(t - 1e-9)), null, ring && t < 3 ? '#ffd34d' : null);
      const near = this.rival(r);
      r.set('tek', r.lost + (near ? ' · ' + Math.round(near.d) + ' m' : ''), null, r.lost >= K.N - K.NEED || (near && near.d < 120) ? '#e8452c' : r.lost >= K.N - K.NEED - 1 ? '#ffb020' : null);
    },
    // the stone (hot or cool) nearest the 4x4 and how far the nearest rival is behind it along the circuit
    rival(r) {
      const P = r.P, T = r.race.track, L = T.len; let o = null, od = 1e9;
      for (const x of r.stones) if (x.state === 'hot' || x.state === 'cool') { const d = Math.hypot((P.x || 0) - x.x, (P.z || 0) - x.z); if (d < od) { od = d; o = x; } }
      if (!o) return null;
      let d = 1e9; for (const c of r.race.cars || []) if (c.hunter && c.q) d = Math.min(d, ((o.s - c.q.s) % L + L) % L);
      return d < 1e8 ? { o, d } : null;
    },
    // the tests' and the pictures' driver: round the circuit to the next stone that is or will be lying, stopped at it until it is cool
    pilot(r, o) {
      const P = r.P, T = r.race.track, q = P.q; if (!q) return [0, 0, 1];
      const L = T.len, ahead = (o2) => ((o2.s - q.s) % L + L) % L;
      let tg = null, best = 1e9; for (const x of r.stones) if (x.state === 'ring' || x.state === 'hot' || x.state === 'cool') { const a = ahead(x); if (a < best) { best = a; tg = x; } }
      const a = KIT.pilot(P, T, Object.assign({ dir: 1, v: 24, lat: 4.5, off: tg && best < 120 ? tg.d : 0 }, o));
      if (tg && best < 60) {   // (slowing to stop beside it; stopped while it is still hot)
        const vt = Math.max(0, Math.sqrt(2 * 2.2 * Math.max(0, best - 1.5))), v = Math.hypot(P.vx, P.vz);
        if (best < 2.5 || (tg.state !== 'cool' && best < 6)) return [a[0], 0, 1];
        return v > vt + 0.5 ? [a[0], 0, clamp((v - vt) / 3, 0.3, 1)] : v < vt - 0.5 ? [a[0], 0.6, 0] : [a[0], 0, 0];
      }
      return a;
    },

    /* ---------------- the look: the shooting stars, the rings, the falling stones, the craters, the glowing stones ---------------- */
    build(r) {
      const fx = r.fx = { st: [] };
      // the stones' bodies, their craters and rings (a pool of K.MAXS; one each)
      const rg = new THREE.IcosahedronGeometry(0.55, 0), cr = new THREE.RingGeometry(0.9, 2.4, 20), ring = new THREE.RingGeometry(2.6, 3.1, 36);
      for (let k = 0; k < K.MAXS; k++) {
        const b = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ color: 0xffb040 })); b.visible = false; r.add(b);
        const c = new THREE.Mesh(cr, new THREE.MeshBasicMaterial({ color: 0x24201c, transparent: true, opacity: 0.85, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }));
        c.rotation.x = -Math.PI / 2; c.visible = false; r.add(c);
        const g = new THREE.Mesh(ring, new THREE.MeshBasicMaterial({ color: 0xffd34d, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 }));
        g.rotation.x = -Math.PI / 2; g.visible = false; g.renderOrder = 2; r.add(g);
        fx.st.push({ b, c, g });
      }
      fx.fire = KIT.fire(r, K.MAXS, { per: 4, spread: 0.8 });   // (the glow and the smoke over a hot stone, the fireball falling)
      // the shooting stars: short bright streaks high over the city (one draw)
      const NS = 7, sp = new Float32Array(NS * 6), G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.BufferAttribute(sp, 3));
      fx.sky = new THREE.LineSegments(G, new THREE.LineBasicMaterial({ color: 0xfff3d0, transparent: true, opacity: 0.9, depthWrite: false, fog: false }));
      fx.sky.frustumCulled = false; r.add(fx.sky); fx.skyP = sp; fx.stars = Array.from({ length: NS }, () => ({ t: -this.rnd(r) * 3 }));
      r.tags = KIT.tags(r);
    },
    draw(r, dt) {
      const fx = r.fx, C = Render.camera, P = r.P;
      const list = r.stones.filter(o => o.state !== 'got' && o.state !== 'rival').slice(-K.MAXS);
      for (let k = 0; k < K.MAXS; k++) {
        const S = fx.st[k], o = list[k];
        if (!o) { S.b.visible = S.c.visible = S.g.visible = false; fx.fire.spot(k, 0, 0, 0, 0); continue; }
        const fall = o.state === 'ring' ? clamp(1 - (o.land - r.t) / 1.2, 0, 1) : 1;
        S.g.visible = o.state === 'ring'; S.g.position.set(o.x, o.y + 0.07, o.z); S.g.material.opacity = 0.5 + 0.45 * Math.abs(Math.sin(r.t * (o.land - r.t < 3 ? 10 : 4)));
        S.c.visible = o.state !== 'ring'; S.c.position.set(o.x, o.y + 0.05, o.z);
        // falling the last 1.2 s on a slant out of the sky (a fireball), then lying in its crater, cooling from yellow-white to dark grey
        S.b.visible = fall > 0;
        const h = (1 - fall) * 160; S.b.position.set(o.x + (1 - fall) * 70, o.y + 0.35 + h, o.z - (1 - fall) * 40);
        const k2 = o.state === 'cool' ? 0 : o.heat; S.b.material.color.setRGB(0.25 + 0.75 * k2, 0.22 + 0.55 * k2, 0.2 + 0.1 * k2);
        fx.fire.spot(k, S.b.position.x, S.b.position.y + 0.2, S.b.position.z, fall > 0 && fall < 1 ? 3.2 : o.state === 'hot' ? 0.6 + 1.2 * o.heat : 0);
      }
      fx.fire.step(dt);
      // the shooting stars: each a streak across the sky for ~0.7 s, then another somewhere else
      if (C) {
        const A = fx.skyP;
        fx.stars.forEach((s, k) => {
          s.t += dt;
          if (s.t > 0.7 || !s.p) { if (s.t > 0.7) s.t = -this.rnd(r) * 2.5; const a = this.rnd(r) * 6.283, d = 380 + this.rnd(r) * 220; s.p = [C.position.x + Math.cos(a) * d, C.position.y + 150 + this.rnd(r) * 160, C.position.z + Math.sin(a) * d]; s.v = [(this.rnd(r) - 0.5) * 300, -90 - this.rnd(r) * 80, (this.rnd(r) - 0.5) * 300]; }
          const on = s.t > 0, u = Math.max(0, s.t);
          for (let e = 0; e < 2; e++) { const tt = on ? u - e * 0.12 : 0; A[k * 6 + e * 3] = s.p[0] + s.v[0] * tt; A[k * 6 + e * 3 + 1] = on ? s.p[1] + s.v[1] * tt : -1e4; A[k * 6 + e * 3 + 2] = s.p[2] + s.v[2] * tt; }
        });
        fx.sky.geometry.attributes.position.needsUpdate = true;
      }
      // the radar: a tag over each ring and each stone on the ground (pinned to the screen's edge when out of sight)
      if (r.tags) r.tags.set(list.map(o => {
        const dd = Math.round(Math.hypot((P.x || 0) - o.x, (P.z || 0) - o.z));
        const at = reach(C, o.x, o.y + 4, o.z);
        return o.state === 'ring' ? Object.assign(at, { html: '<b>' + tr('UDAR') + '</b>' + Missions.clock(Math.ceil(Math.max(0, o.land - r.t) - 1e-9)) + ' · ' + dd + ' m', cls: '' })
          : o.state === 'hot' ? Object.assign(at, { html: '<b>' + tr('METEORIT') + '</b>' + Math.round(40 + (K.HOT - 40) * o.heat) + ' °C · ' + dd + ' m', cls: 'hot' })
          : Object.assign(at, { html: '<b>' + tr('METEORIT') + '</b>' + dd + ' m', cls: 'go' });
      }));
    },
  });
})();
