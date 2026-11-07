/* Special mission 33 · Odvoz snega · Montréal, Kanada (js/missions.js; the kit: js/missions/kit.js). After the blizzard the city takes
   the snow away at night: a snowblower (a prop of its own, not a car of the race) works along the road's right lane (K.LANE m right of the
   centre line), eating the bank on its side (the piles there go as it passes) and throwing the snow left from its chute in an arc
   (MisKit.jet) that lands K.SIDE m to its left, K.BACK m behind its middle. The player's dump truck (MisKit.skin over the racing truck's
   physics, its own limiter K.VMAX) drives beside it: with its box under the arc (along within K.HITL m, across within K.HITW m) the box
   fills (K.FILL a second; the heap in it grows). Full: one truck more (POLNI KIPERJI), the blower waits K.SWAP s while the next one takes
   its place (the box empty again). K.NEED full trucks: done. The blower moves at K.VF only with the truck beside it (within K.NEAR m), else
   it waits. Running into the blower (over K.CRASH m/s): failed. */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js');
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s);
  const K = { S0: 45, LANE: 2.4, VF: 4.4, VMAX: 50, SIDE: 4.3, BACK: 0.6, BOX: -1.2, HITL: 1.7, HITW: 1.2, FILL: 0.02, NEED: 4, SWAP: 6, NEAR: 22, CRASH: 3, FL: 5.0, FW: 2.7, RUN: 2400 };
  const ORA = 0xf07a12, DORA = 0xb8560a, BLK = 0x1b1d21, GRY = 0x8f979f, GLS = 0x1d2733, WH = 0xe9e6df, DGRY = 0x4a4f56;

  // the dump truck: the cab in front, the box behind it (open on top: the heap of snow its own mesh), three axles (x forward, y up, z to the side)
  function truck(B) {
    B.box(0, 0.75, 0, 6.6, 0.4, 1.9, BLK);
    B.box(2.55, 1.85, 0, 1.5, 1.9, 2.4, WH); B.box(3.31, 2.2, 0, 0.04, 0.8, 2.1, GLS); B.box(2.55, 2.84, 0, 1.55, 0.08, 2.45, 0xc9c5bd);
    B.box(3.32, 1.05, 0.9, 0.05, 0.2, 0.32, 0xfff4cc); B.box(3.32, 1.05, -0.9, 0.05, 0.2, 0.32, 0xfff4cc);
    B.box(K.BOX, 1.15, 0, 4.4, 0.12, 2.4, DGRY);
    for (const sd of [-1, 1]) B.box(K.BOX, 1.8, sd * 1.17, 4.4, 1.2, 0.08, DGRY);
    B.box(K.BOX + 2.18, 1.8, 0, 0.08, 1.2, 2.4, DGRY); B.box(K.BOX - 2.18, 1.8, 0, 0.08, 1.2, 2.4, 0x3a3e44);
    B.box(K.BOX - 2.23, 1.0, 0.95, 0.04, 0.2, 0.3, 0xff3a2a); B.box(K.BOX - 2.23, 1.0, -0.95, 0.04, 0.2, 0.3, 0xff3a2a);
    for (const x of [2.3, -1.6, -2.9]) for (const sd of [-1, 1]) B.cyl(x, 0.55, sd * 1.02, 0.55, 0.4, BLK);
  }
  // the snowblower: the body, the cab high in front, the auger's housing in front, the chute on top turned to its left
  function blower() {
    const B = KIT.parts();
    B.box(-0.3, 1.2, 0, 4.0, 1.4, 2.5, ORA); B.box(0.6, 2.55, 0, 1.6, 1.3, 2.2, ORA); B.box(1.41, 2.65, 0, 0.04, 0.8, 2.0, GLS); B.box(0.6, 3.24, 0, 1.65, 0.08, 2.25, DORA);
    B.box(2.4, 0.75, 0, 1.0, 1.3, K.FW, DORA); B.box(2.95, 0.3, 0, 0.15, 0.3, K.FW, GRY);
    for (const x of [1.0, -1.6]) for (const sd of [-1, 1]) B.cyl(x, 0.6, sd * 1.2, 0.6, 0.45, BLK);
    B.box(1.4, 2.6, -1.0, 0.6, 1.0, 0.6, DORA); B.box(1.4, 3.25, -1.6, 0.55, 0.45, 1.3, ORA);
    B.box(-2.33, 1.3, 0.9, 0.04, 0.2, 0.3, 0xff3a2a); B.box(-2.33, 1.3, -0.9, 0.04, 0.2, 0.3, 0xff3a2a);
    const g = new THREE.Group(), body = B.mesh(new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x3a1a04 }));   // (its own work lights: seen at night) body.castShadow = true; g.add(body);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.3), new THREE.MeshBasicMaterial({ color: 0xffa21a })); lamp.position.set(0.3, 3.4, 0); g.add(lamp); g.userData.lamp = lamp;
    return g;
  }
  const wrap = (d, L) => ((d % L) + L * 1.5) % L - L / 2;   // (a gap along a closed road: -L/2 .. L/2)

  Missions.add({
    id: '33', title: 'Odvoz snega', track: 'montreal', limit: 390, stars: [280, 330], K,
    story: 'Po snežnem metežu mesto ponoči odvaža sneg. Freza ga meče v tovornjake ob sebi.',
    goal: 'S kiperjem vozi ob frezi, da curek snega pada v tvoj kiper.',
    hint: 'Vozi enako hitro kot freza, da sneg pada v kiper.',
    rows: [{ k: 'curek', label: 'CUREK', bar: true }, { k: 'kiper', label: 'KIPER', bar: true, col: '#4a8cff' }, { k: 'polni', label: 'POLNI KIPERJI' }],
    // alone on the circuit, in the snow, at night; the dump truck: the racing truck's physics, slow (K.VMAX), no damage
    opts: () => ({ tt: true, laps: 3, playerModel: KIT.truckModel('titan', { vLim: K.VMAX, len: 7.0, wid: 2.5 }), playerColor: WH, damage: 0 }),
    begin(r) {
      const T = r.race.track;
      r.fs = T.startS + K.S0; r.fill = 0; r.full = 0; r.swap = 0; r.hit = false; r.e = [0, 0]; r.near = false;
      if (typeof Render !== 'undefined' && Render.setAtmos) Render.setAtmos({ season: 'winter', tod: 'night' }, true);
      if (typeof THREE !== 'undefined' && typeof document !== 'undefined') {
        // the banks: on the left all the way, on the blower's side in pieces of 200 m that go as it passes them
        KIT.piles(r, T, r.fs - 60, r.fs + K.RUN, { side: -1, every: 4, h: 1.1 });
        r.banks = [];
        for (let a = r.fs - 60; a < r.fs + K.RUN; a += 200) { const m = KIT.piles(r, T, a, Math.min(a + 196, r.fs + K.RUN), { side: 1, every: 4, h: 1.3 }); if (m) r.banks.push({ e: a + 200, m }); }
        r.bl = blower(); r.add(r.bl);
        r.jet = KIT.jet(r);
        r.skin = KIT.skin(r, r.P, truck);
        if (r.skin) {
          const heap = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1, 2.25), new THREE.MeshLambertMaterial({ color: 0xf2f5f8 })); heap.position.set(K.BOX, 1.21, 0); heap.visible = false; r.skin.add(heap); r.heap = heap;
          const v = Render.viewOf(r.P); if (v && v.lights && v.lights.length >= 4) { v.lights[0].set(3.34, 1.05, -0.9); v.lights[1].set(3.34, 1.05, 0.9); v.lights[2].set(K.BOX - 2.25, 1.0, -0.95); v.lights[3].set(K.BOX - 2.25, 1.0, 0.95); }
        }
      }
      this.place(r); this.show(r);
    },
    // the blower on its lane at r.fs, facing along the road; where its arc lands (the world), its chute's mouth
    place(r) {
      const T = r.race.track, s = ((r.fs % T.len) + T.len) % T.len, i = T.idx(s), nx = T.nx[i], nz = T.nz[i], tx = T.tx[i], tz = T.tz[i];
      r.fx = T.px[i] + nx * K.LANE; r.fz = T.pz[i] + nz * K.LANE; r.fh = Math.atan2(tz, tx); r.fy = T.hy ? T.hy[i] : 0;
      r.land = { x: r.fx - nx * K.SIDE - tx * K.BACK, z: r.fz - nz * K.SIDE - tz * K.BACK };
      if (r.bl) {
        r.bl.position.set(r.fx, r.fy, r.fz); r.bl.rotation.y = -r.fh;
        r.mouth = new THREE.Vector3(r.fx + tx * 1.4 - nx * 2.2, r.fy + 3.3, r.fz + tz * 1.4 - nz * 2.2);
      }
    },
    step(r, dt) {
      const P = r.P, T = r.race.track, q = P.q; if (!q) return;
      P.wrongT = 0;
      // the truck against the blower: a box it bumps into
      const imp = KIT.block(P, { x: r.fx, z: r.fz, h: r.fh, L: K.FL, W: K.FW });
      if (imp > K.CRASH) { r.fail(tr('Zadel si frezo.')); return; }
      // where the box is against the arc's landing (along the road, across it)
      const ch = Math.cos(P.h), sh = Math.sin(P.h), bx = P.x + ch * K.BOX, bz = P.z + sh * K.BOX, i = T.idx(((r.fs % T.len) + T.len) % T.len);
      const dx = r.land.x - bx, dz = r.land.z - bz, el = dx * T.tx[i] + dz * T.tz[i], ew = dx * T.nx[i] + dz * T.nz[i];
      r.e = [el, ew];
      const gap = wrap(q.s - r.fs, T.len);
      r.near = Math.abs(gap) < K.NEAR && Math.abs(q.d + K.SIDE - K.LANE) < 3.5;
      // the blower: waits for a truck beside it, during a swap too
      if (r.swap > 0) { r.swap -= dt; if (r.swap <= 0) { r.fill = 0; r.say(this.hint); } }
      else if (r.near) r.fs += K.VF * dt;
      const work = r.swap <= 0 && r.near;
      r.hit = work && Math.abs(el) < K.HITL && Math.abs(ew) < K.HITW;
      if (r.hit) {
        r.fill = Math.min(1, r.fill + K.FILL * dt);
        if (r.fill >= 1) { r.full++; if (r.full >= K.NEED) { r.win(); } else { r.swap = K.SWAP; r.say('Kiper je poln: naslednji se postavlja pod curek.'); } }
      }
      this.place(r);
      // the banks the blower has eaten
      if (r.banks) for (const b of r.banks) if (b.m.visible && r.fs > b.e) b.m.visible = false;
      if (r.jet && r.mouth) { const to = r.hit ? { x: bx, y: (P.y || r.fy) + 2.2, z: bz } : { x: r.land.x, y: r.fy + 0.2, z: r.land.z }; r.jet.set(r.mouth, to, work); r.jet.step(dt); }
      if (r.heap) { r.heap.visible = r.fill > 0.02 && r.swap <= 0; r.heap.scale.y = 0.1 + 1.4 * r.fill; r.heap.position.y = 1.21 + 0.5 * r.heap.scale.y; }
      if (r.bl) r.bl.userData.lamp.visible = (r.t * 1.4) % 1 < 0.5;
      if (r.swap <= 0) r.say(!r.near ? (gap < -K.NEAR ? 'Dohiti frezo: čaka te.' : gap > K.NEAR ? 'Prehitel si frezo: počakaj jo.' : 'Zapelji na levi pas ob frezi.') : r.hit ? this.hint : Math.abs(ew) >= K.HITW ? (ew > 0 ? 'Bolj desno, bliže frezi.' : 'Bolj levo, stran od freze.') : el > 0 ? 'Malo naprej.' : 'Malo nazaj.');
      this.show(r);
    },
    // (no finish line: the circuit goes round, the mission ends by the trucks or the time)
    finish() {},
    show(r) {
      const a = Math.max(0, 1 - Math.abs(r.e[0]) / (K.HITL * 4)) * Math.max(0, 1 - Math.abs(r.e[1]) / (K.HITW * 4));
      r.set('curek', r.swap > 0 ? tr('zamenjava') : r.hit ? tr('ZADENEŠ') : r.near ? (Math.abs(r.e[0]) < K.HITL * 2 && Math.abs(r.e[1]) < K.HITW * 2 ? tr('skoraj') : tr('mimo')) : '—', r.near ? a : 0, r.hit ? '#3fbf6a' : '#ffb020');
      r.set('kiper', Math.round(r.fill * 100) + ' %', r.fill);
      r.set('polni', r.full + ' / ' + K.NEED);
    },
  });
})();
