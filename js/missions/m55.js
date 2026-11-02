/* Special mission 55 · Medvedi na cesti · Beartooth, ZDA (js/missions.js; the kit: js/missions/kit.js, MisKit.skin, herd, crowd, tags,
   button, block). On the high plateau a mother bear with her two cubs has stopped in the middle of the road; the tourists' cars stand in a
   jam in the right lane behind them (K.JAM cars) and some have got out (K.TOURISTS beside their cars on the right). The ranger (an
   off-roader with its light bar: MisKit.skin over the off-roader's physics) starts K.S0 m past the start line. First the megaphone: within
   K.MEGA m of a tourist out, MEGAFON sends the ones in reach back into their cars. Then the horn: with every tourist in, HUPA from between
   K.NEAR and K.FAR m from the mother moves the bears K.STEP m on, off the road to its roomier side (they walk at K.BV m/s). The mother must
   not be pushed: within K.NEAR m of her she grows restless (K.CLOSE a second, under K.TOO m K.CLOSE2), a honk from too close or soon after
   the last (K.GAP s) more (K.LOUD); calming down K.CALM a second; at 1 she charges: failed. Into the bears or the cars: they are boxes
   (MisKit.block); a bear hit: failed. The bears K.OFF m past the road's edge with the tourists in: the jam cleared, done. */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js');
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s);
  const K = { S0: 610, SB: 1060, JAM: 7, JGAP: 7.5, TOURISTS: 3, MEGA: 35, NEAR: 25, TOO: 15, FAR: 60, STEP: 7, BV: 1.3, OFF: 9,
    CLOSE: 0.18, CLOSE2: 0.5, LOUD: 0.25, GAP: 1.6, CALM: 0.07, NICE: 0.04, VMAX: 90 };
  const GRN = 0x2f5a3a, TAN = 0xc9b48a, BLK = 0x1b1d21, GLS = 0x1d2733, AMB = 0xffa21a;
  const CARS = [0xb8202a, 0x2f5fb8, 0xd9dde2, 0x3c3f44, 0xe6c24a, 0x6a8a9a, 0x8a2f5a];

  // the ranger's off-roader: green, a tan band, the light bar on the roof (its lamps a mesh of their own: blinking)
  function ranger(B) {
    B.box(0, 1.0, 0, 4.8, 0.95, 1.95, GRN); B.box(-0.35, 1.8, 0, 3.0, 0.75, 1.85, GRN); B.box(0, 0.95, 0, 4.82, 0.18, 1.97, TAN);
    B.box(1.17, 1.8, 0, 0.04, 0.6, 1.7, GLS); B.box(-1.86, 1.8, 0, 0.04, 0.55, 1.7, GLS); for (const sd of [-1, 1]) B.box(-0.35, 1.82, sd * 0.93, 2.8, 0.5, 0.02, GLS);
    B.box(-0.35, 2.2, 0, 2.9, 0.05, 1.8, 0x24452d); B.box(0.3, 2.3, 0, 0.3, 0.14, 1.5, 0x2a2d31);
    B.box(2.41, 1.05, 0.7, 0.04, 0.18, 0.3, 0xfff4cc); B.box(2.41, 1.05, -0.7, 0.04, 0.18, 0.3, 0xfff4cc);
    B.box(-2.41, 1.1, 0.75, 0.04, 0.25, 0.2, 0xff3a2a); B.box(-2.41, 1.1, -0.75, 0.04, 0.25, 0.2, 0xff3a2a); B.box(-2.5, 1.2, 0, 0.12, 0.7, 0.7, BLK);
    for (const x of [1.5, -1.45]) for (const sd of [-1, 1]) B.cyl(x, 0.42, sd * 0.88, 0.42, 0.3, BLK);
  }
  // the jam: K.JAM cars of simple bodies (one mesh), each at its place in the right lane
  function jamParts(B, list) {
    list.forEach((c, k) => {
      const ry = c.ry, co = Math.cos(ry), sn = Math.sin(ry), at = (u, v) => [c.x + u * co + v * sn, c.z - u * sn + v * co];
      const box = (u, y, v, lx, ly, lz, col) => { const [x, z] = at(u, v); B.box(x, c.y + y, z, lx, ly, lz, col, ry); };
      const col = CARS[k % CARS.length], big = k % 3 === 1;
      box(0, 0.7, 0, big ? 4.9 : 4.3, big ? 1.0 : 0.75, 1.85, col); box(-0.3, big ? 1.6 : 1.35, 0, big ? 3.2 : 2.3, big ? 0.8 : 0.6, 1.7, big ? col : GLS);
      if (big) box(-0.3, 1.6, 0, 3.0, 0.45, 1.72, GLS);
      box(-(big ? 2.46 : 2.16), 0.8, 0.7, 0.04, 0.2, 0.25, 0xff3a2a); box(-(big ? 2.46 : 2.16), 0.8, -0.7, 0.04, 0.2, 0.25, 0xff3a2a);
    });
  }

  Missions.add({
    id: '55', title: 'Medvedi na cesti', track: 'beartooth', limit: 200, stars: [75, 110], K,
    story: 'Medvedka z mladičema je obstala sredi ceste. Turisti so ustavili in nekateri izstopili.',
    goal: 'Z megafonom pošlji turiste nazaj v avte, nato medvede s hupo počasi odženi s ceste in razženi zastoj.',
    hint: 'Z megafonom pošlji turiste v avte, nato medvede s hupo počasi odženi.',
    rows: [{ k: 'med', label: 'MEDVEDI' }, { k: 'raz', label: 'RAZDALJA', bar: true }, { k: 'tur', label: 'TURISTI ZUNAJ' }, { k: 'zas', label: 'ZASTOJ' }],
    // alone on the closed road (the jam is the mission's own), dry, by day; the off-roader, its own limiter, no damage
    opts: () => ({ tt: true, laps: 1, playerModel: KIT.truckModel('medved', { vLim: K.VMAX }), playerColor: GRN, damage: 0 }),
    made(race) {
      const T = race.track, c = race.player; if (!c) return;
      const s = T.startS + K.S0, i = T.idx(s);
      c.place(T.px[i], T.pz[i], T.hd[i]); if (T.hasElev) { c.y = c.py = T.hy[i]; c.roadY = c.y; }
      c.dist = s - T.startS; c.q = T.query(T.px[i], T.pz[i], i, {}); c.sPrev = c.q.s;
      while (c.cp < T.cpS.length && c.dist >= T.cpDist[c.cp]) { c.splits.push(0); c.cp++; }
    },
    begin(r) {
      const T = r.race.track, sB = T.startS + K.SB, iB = T.idx(sB), w = T.wS(sB);
      const pt = (s, d) => { const i = T.idx(s); return { x: T.px[i] + T.nx[i] * d, z: T.pz[i] + T.nz[i] * d, y: T.hy[i], i, h: Math.atan2(T.tz[i], T.tx[i]) }; };
      r.ag = 0; r.lastHonk = -9; r.honks = 0; r.cleared = false; r.w = w; r.sB = sB;
      r.side = T.br[iB] >= T.bl[iB] ? 1 : -1;   // (the bears go off to the road's roomier side)
      r.bears = [{ d: 0.8, u: 0, size: 1 }, { d: -1.6, u: -2.6, size: 0.48 }, { d: 2.6, u: 2.2, size: 0.45 }].map(b => Object.assign(b, { dt: b.d }));
      r.cars = []; for (let k = 0; k < K.JAM; k++) { const p = pt(sB - 16 - k * K.JGAP, w * 0.5); r.cars.push({ x: p.x, z: p.z, y: p.y, h: p.h, ry: -p.h, L: k % 3 === 1 ? 4.9 : 4.3, W: 1.9 }); }
      r.tour = []; for (let k = 0; k < K.TOURISTS; k++) { const c = r.cars[k * 2 + 1], p = pt(sB - 16 - (k * 2 + 1) * K.JGAP + 0.6, w + 1.4); r.tour.push({ x: p.x, z: p.z, y: p.y, car: c, out: true, go: 0 }); }
      r.place = (b) => { const s = sB + b.u, i = T.idx(s); return { x: T.px[i] + T.nx[i] * b.d, z: T.pz[i] + T.nz[i] * b.d, i }; };
      if (typeof Render !== 'undefined' && Render.setAtmos) Render.setAtmos({ season: 'summer', tod: 'day' }, true);
      if (typeof THREE !== 'undefined' && typeof document !== 'undefined') {
        r.skin = KIT.skin(r, r.P, ranger);
        if (r.skin) {
          const on = new THREE.MeshBasicMaterial({ color: AMB }), off = new THREE.MeshLambertMaterial({ color: 0x5a3a10 });
          const L = [new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.6), on), new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.6), off)];
          L[0].position.set(0.3, 2.42, 0.42); L[1].position.set(0.3, 2.42, -0.42); r.skin.add(L[0], L[1]);
          r.blink = (t) => { const a = (t * 1.8) % 1 < 0.5; L[0].material = a ? on : off; L[1].material = a ? off : on; };
        }
        const B = KIT.parts(); jamParts(B, r.cars);
        r.jam = B.mesh(new THREE.MeshLambertMaterial({ vertexColors: true })); r.jam.castShadow = true; r.add(r.jam);
        r.herd = KIT.herd(r, 'bear', 3); r.crowd = KIT.crowd(r, K.TOURISTS); r.tags = KIT.tags(r);
        const TC = [0xc0392b, 0xe2b52b, 0x2e8b57];
        r.tour.forEach((q, k) => r.crowd.put(k, q.x, q.y - 0.28, q.z, -q.car.h, TC[k]));
      }
      r.btn = KIT.button(r, 'MEGAFON');
      { const p = r.place(r.bears[0]); r.dist = Math.hypot(r.P.x - p.x, r.P.z - p.z); }
      this.draw(r); this.show(r);
    },
    draw(r) {
      const T = r.race.track;
      if (r.herd) r.bears.forEach((b, k) => { const p = r.place(b), gy = KIT.at(T, r.sB + b.u, b.d).y; r.herd.put(k, p.x, gy, p.z, b.walk ? -(Math.atan2(T.tz[p.i], T.tx[p.i]) + r.side * Math.PI / 2) : -(Math.atan2(T.tz[p.i], T.tx[p.i])) + (k ? 0.6 : -0.4), b.size, b.walk ? b.ph : 0); });
    },
    step(r, dt) {
      const P = r.P, T = r.race.track, sow = r.place(r.bears[0]);
      const dist = Math.hypot(P.x - sow.x, P.z - sow.z), v = Math.hypot(P.vx || 0, P.vz || 0);
      P.wrongT = 0; P.stuckT = 0;
      // the cars and the bears are in the way
      for (const c of r.cars) KIT.block(P, c);
      let hit = 0; r.bears.forEach((b) => { const p = r.place(b); hit = Math.max(hit, KIT.block(P, { x: p.x, z: p.z, h: Math.atan2(T.tz[p.i], T.tx[p.i]) + Math.PI / 2, L: 1.9 * b.size + 0.2, W: 1.0 * b.size + 0.2 })); });
      if (hit > 0.5) { r.fail(tr('Zadel si medveda.')); return; }
      // the tourists: the megaphone sends the ones in reach back to their cars
      const out = r.tour.filter(q => q.out), near = out.filter(q => Math.hypot(P.x - q.x, P.z - q.z) < K.MEGA);
      let say = null;
      if (out.length) {
        r.btn.label('MEGAFON'); r.btn.show(near.length > 0 && !near.every(q => q.go > 0));
        if (r.btn.take() || (r.autoBtn && near.length)) { near.forEach(q => { if (!q.go) q.go = 0.001; }); say = 'Turisti se vračajo v avte.'; r.saidT = 2; }
        else if (!(r.saidT > 0)) say = near.length ? 'MEGAFON: pošlji turiste v avte.' : 'Zapelji bliže turistom.';
      } else if (!r.cleared) {
        r.btn.label('HUPA'); r.btn.show(dist < K.FAR + 25);
        if (r.btn.take() || (r.autoBtn && dist >= K.NEAR && dist <= K.FAR && r.t - r.lastHonk > K.GAP + 0.2)) {
          const soon = r.t - r.lastHonk < K.GAP; r.lastHonk = r.t; r.honks++;
          if (dist < K.NEAR || soon) { r.ag += K.LOUD; say = dist < K.NEAR ? 'Preblizu! Medvedka se je obrnila proti tebi.' : 'Preglasno: počakaj med hupanji.'; r.saidT = 2; }
          else if (dist <= K.FAR) { r.ag += K.NICE; r.bears.forEach(b => { b.dt = Math.min(r.w + K.OFF + 4, Math.abs(b.dt) + K.STEP) * r.side; }); say = 'Medvedi se umikajo.'; r.saidT = 2; }
          else { say = 'Predaleč: medvedi te ne slišijo.'; r.saidT = 2; }
        }
      }
      if (r.saidT > 0) r.saidT -= dt;
      r.tour.forEach((q, k) => { if (!q.out || !q.go) return; q.go += dt; const f = Math.min(1, q.go / 2); const x = q.x + (q.car.x - q.x) * f, z = q.z + (q.car.z - q.z) * f; if (f >= 1) { q.out = false; if (r.crowd) r.crowd.hide(k); } else if (r.crowd) r.crowd.put(k, x, q.y - 0.28, z, Math.atan2(-(q.car.z - q.z), q.car.x - q.x) + Math.PI / 2); });
      // the bears walk toward where the horn sent them
      r.bears.forEach(b => { const e = b.dt - b.d; b.walk = Math.abs(e) > 0.05; if (b.walk) { b.d += Math.sign(e) * Math.min(Math.abs(e), K.BV * (b.size < 1 ? 1.15 : 1) * dt); b.ph = (b.ph || 0) + dt * 6; } });
      this.draw(r);
      // the mother's mood: restless when too close, calming down slowly
      r.ag += dist < K.TOO ? K.CLOSE2 * dt : dist < K.NEAR ? K.CLOSE * dt : -K.CALM * dt;
      r.ag = Math.max(0, r.ag);
      if (r.ag >= 1) { r.fail(tr('Medvedka je postala nevarna.')); return; }
      if (!r.cleared && !r.tour.some(q => q.out) && r.bears.every(b => Math.abs(b.d) > r.w + K.OFF)) { r.cleared = true; r.btn.show(false); this.show(r); r.win(); return; }
      if (r.blink) r.blink(r.t);
      if (r.tags) r.tags.set(dist < 260 && !r.cleared ? [{ x: sow.x, y: KIT.at(T, r.sB, r.bears[0].d).y + 3.4, z: sow.z, html: '<b>' + tr('MEDVEDKA Z MLADIČEMA') + '</b>' + tr('ne bližje kot {0} m', K.NEAR), cls: dist < K.NEAR ? '' : 'go' }] : []);
      r.dist = dist;
      r.say(say || (r.saidT > 0 ? r.hint : dist < K.NEAR ? 'Preblizu medvedke: zapelji nazaj.' : !r.tour.some(q => q.out) ? 'HUPA od daleč (25–60 m), počasi in s premori.' : this.hint));
      this.show(r);
    },
    show(r) {
      const a = r.ag || 0;
      r.set('med', a < 0.35 ? tr('mirni') : a < 0.7 ? tr('vznemirjeni') : tr('jezni'), null);
      const d = r.dist != null ? r.dist : 999;
      r.set('raz', Math.round(d) + ' m', Math.min(1, d / K.FAR), d < K.NEAR ? '#e8452c' : d <= K.FAR ? '#3fbf6a' : '#ffb020');
      r.set('tur', String(r.tour ? r.tour.filter(q => q.out).length : K.TOURISTS));
      r.set('zas', r.cleared ? tr('razžen') : tr('{0} vozil', K.JAM));
    },
  });
})();
