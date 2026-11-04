/* Special mission 04 · Vlečna služba · Pikes Peak, ZDA (js/missions.js; the kit: js/missions/kit.js). A car broke down at the summit: the
   tow truck (MisKit.skin over TITAN's physics, its own limiter K.VMAX) stands K.TOP m below the finish line facing down the road, the
   broken car parked behind it. First the crew hooks it up (K.HOOK s, the truck held: the arm lowered, the car's front lifted onto it,
   the strap tied), then down the whole road to the start line in the valley (the road driven the other way: MisKit.place back, the
   wrong way allowed). The strap (NAPETOST VRVI) takes the car's weight when the truck brakes: the harder the braking and the faster it
   started (sudden braking from a speed over K.VREF is red: over K.RED for K.SNAP s and it snaps, the car slides off: failed). The car
   behind follows the truck's path on its arm; it swings out in a bend taken too fast (the sideways pull over K.LAT m/s2) and is knocked
   when the truck hits a wall: ŠKODA NA AVTU (at 100 %: failed). In the valley with the car whole: done. */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js');
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s);
  const dec = (s) => (typeof Lang !== 'undefined' && Lang.dec ? Lang.dec(s) : String(s).replace('.', ','));
  const K = { TOP: 45, VMAX: 75, HOOK: 4, ARM: -3.9, GAP: 1.2, CAR: 4.4, VREF: 14, DREF: 5, VHD: 4, RED: 0.88, SNAP: 1.0, LAT: 3.8, SWING: 0.03, HITK: 0.045, HIT: 1.5 };
  const YEL = 0xf2b51c, DYL = 0xc98d10, BLK = 0x1b1d21, GRY = 0x8f979f, GLS = 0x1d2733, GRN = 0x2f7a58;

  // the tow truck: the cab, the body with its boxes, the boom and the lifting arm at the back, the amber lamps (x forward, y up, z to the side)
  function towTruck(B) {
    B.box(2.55, 1.55, 0, 1.9, 1.9, 2.4, YEL); B.box(3.51, 1.85, 0, 0.04, 0.85, 2.15, GLS); for (const sd of [-1, 1]) B.box(2.75, 1.9, sd * 1.21, 1.1, 0.7, 0.03, GLS);
    B.box(2.55, 2.53, 0, 1.95, 0.06, 2.42, DYL);
    B.box(-0.8, 0.95, 0, 5.0, 0.35, 2.3, BLK); B.box(0.2, 1.45, 0, 2.6, 0.75, 2.35, YEL);
    for (const sd of [-1, 1]) B.box(-1.9, 1.35, sd * 1.05, 2.2, 0.45, 0.2, DYL);
    B.box(-1.6, 2.1, 0, 3.4, 0.28, 0.4, YEL, -0.32); B.box(-3.25, 2.55, 0, 0.3, 0.3, 0.3, DYL);
    B.box(-3.45, 0.55, 0, 0.9, 0.18, 0.5, GRY); B.box(-3.85, 0.5, 0, 0.18, 0.22, 2.0, GRY);
    for (const x of [2.6, -1.4, -2.6]) for (const sd of [-1, 1]) B.cyl(x, 0.5, sd * 1.05, 0.5, 0.36, BLK);
    B.box(3.52, 0.95, 0.85, 0.05, 0.2, 0.35, 0xfff4cc); B.box(3.52, 0.95, -0.85, 0.05, 0.2, 0.35, 0xfff4cc);
  }
  // the broken car: a green saloon (its front lifted onto the arm by the mission)
  function brokenCar() {
    const B = KIT.parts();
    B.box(0, 0.62, 0, 4.4, 0.62, 1.8, GRN); B.box(-0.25, 1.18, 0, 2.3, 0.55, 1.62, GRN);
    B.box(0.93, 1.16, 0, 0.04, 0.45, 1.5, GLS); B.box(-1.42, 1.16, 0, 0.04, 0.45, 1.5, GLS); for (const sd of [-1, 1]) B.box(-0.25, 1.18, sd * 0.82, 2.0, 0.38, 0.02, GLS);
    for (const x of [1.35, -1.35]) for (const sd of [-1, 1]) B.cyl(x, 0.34, sd * 0.82, 0.34, 0.24, BLK);
    B.box(-2.21, 0.75, 0.62, 0.03, 0.16, 0.32, 0xd8282a); B.box(-2.21, 0.75, -0.62, 0.03, 0.16, 0.32, 0xd8282a);
    const m = B.mesh(new THREE.MeshLambertMaterial({ vertexColors: true })); m.castShadow = true;
    const g = new THREE.Group(); m.position.x = -K.CAR / 2; g.add(m);   // (its origin at its front bumper: hung on the arm there)
    return g;
  }

  Missions.add({
    id: '04', title: 'Vlečna služba', track: 'pikes', limit: 720, stars: [520, 620], K,
    story: 'Na vrhu je obstal pokvarjen avto. Vlečno vozilo ga mora spraviti v dolino po strmi cesti.',
    goal: 'Pokvarjen avto zvleci v dolino brez nove škode.',
    hint: 'Zaviraj nežno, da se vrv ne strga.',
    rows: [{ k: 'vrv', label: 'NAPETOST VRVI', bar: true }, { k: 'skoda', label: 'ŠKODA NA AVTU', bar: true, col: '#e8452c' }, { k: 'dolina', label: 'DO DOLINE' }],
    // alone on the closed road; the tow truck: TITAN's physics, slower, no damage of its own (the car behind counts)
    opts: () => ({ tt: true, playerModel: KIT.truckModel('titan', { vLim: K.VMAX, kw: 300, len: 7.4, wid: 2.45, mass: 6500 }), playerColor: YEL, damage: 0 }),
    // the truck K.TOP m below the summit's finish line, facing down the road
    made(race) { const T = race.track, c = race.player; if (c) KIT.place(c, T, T.finishS - K.TOP, true); },
    begin(r) {
      const T = r.race.track;
      r.stage = 'hook'; r.hookT = 0; r.ten = 0.12; r.red = 0; r.dmg = 0; r.acc = 0; r.vf = 0; r.end0 = T.startS; r.len = T.finishS - K.TOP - T.startS;
      r.trail = []; r.swing = 0;
      if (typeof Render !== 'undefined' && Render.setAtmos) Render.setAtmos({ season: 'summer', tod: 'day' }, true);
      KIT.backRoad(r);
      if (typeof THREE !== 'undefined' && typeof document !== 'undefined') {
        r.skin = KIT.skin(r, r.P, towTruck);
        if (r.skin) {
          const on = new THREE.MeshBasicMaterial({ color: 0xffa21a }), L = KIT.parts(); for (const sd of [-1, 1]) L.box(2.4, 2.66, sd * 0.75, 0.3, 0.18, 0.35, 0);
          r.lamp = new THREE.Mesh(KIT.merged(L.L), on); r.skin.add(r.lamp);
          const v = Render.viewOf(r.P); if (v && v.lights && v.lights.length >= 4) { v.lights[0].set(3.55, 0.95, -0.85); v.lights[1].set(3.55, 0.95, 0.85); v.lights[2].set(-3.9, 0.9, -1.0); v.lights[3].set(-3.9, 0.9, 1.0); }
        }
        r.car = brokenCar(); r.add(r.car);
        const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
        r.rope = new THREE.Line(lg, new THREE.LineBasicMaterial({ color: 0xf2f2f2 })); r.rope.frustumCulled = false; r.add(r.rope);
      }
      this.pose(r, 0);
      this.show(r);
    },
    // the hitch at the back of the arm (from the physics: P.x, P.z, P.h), the path behind it kept every 0.4 m
    hitch(P, T) { const ch = Math.cos(P.h), sh = Math.sin(P.h); return { x: P.x + ch * K.ARM, z: P.z + sh * K.ARM, y: (P.y != null ? P.y : T.hy[T.idx(P.q ? P.q.s : 0)]) }; },
    // the point on the truck's path d m behind the hitch (before the path is that long: straight behind the truck)
    behind(r, d) {
      const P = r.P, h = this.hitch(P, r.race.track), L = r.trail;
      let x = h.x, z = h.z, y = h.y, left = d;
      for (let k = L.length - 1; k >= 0; k--) { const p = L[k], g = Math.hypot(p.x - x, p.z - z); if (g >= left) { const f = left / g; return { x: x + (p.x - x) * f, z: z + (p.z - z) * f, y: y + (p.y - y) * f }; } left -= g; x = p.x; z = p.z; y = p.y; }
      return { x: x - Math.cos(P.h) * left, z: z - Math.sin(P.h) * left, y };
    },
    // the car behind on its arm: its front at the hitch (lifted as the crew hooks it), its rear on the truck's path; the strap drawn
    pose(r, lift) {
      if (!r.car) return;
      const P = r.P, T = r.race.track, h = this.hitch(P, T), f = this.behind(r, K.GAP), b = this.behind(r, K.GAP + K.CAR);
      const hy = (b.y || h.y), up = 0.55 * lift, yaw = Math.atan2(f.z - b.z, f.x - b.x) + r.swing;
      r.car.position.set(f.x, h.y + up, f.z); r.car.rotation.set(0, -yaw, 0); r.car.rotateZ(Math.atan2(h.y + up - hy, K.CAR) * 0.9);
      if (r.rope) { const a = r.rope.geometry.attributes.position; a.setXYZ(0, h.x, h.y + 2.55, h.z); a.setXYZ(1, f.x, h.y + up + 0.65, f.z); a.needsUpdate = true;
        r.rope.material.color.setHex(r.ten > K.RED ? 0xff4a2a : r.ten > 0.65 ? 0xffc040 : 0xf2f2f2); }
    },
    step(r, dt) {
      const P = r.P, T = r.race.track, q = P.q; if (!q) return;
      P.wrongT = 0; P.stuckT = 0; P.noReverse = true;   // (down the road made to be driven up: the wrong way is the way; the brake held stopped keeps it there)
      if (r.lamp) r.lamp.visible = (r.t * 1.6) % 1 < 0.5;
      if (r.stage === 'hook') {
        KIT.hold(P); r.hookT += dt;
        r.say('Posadka pripenja pokvarjeni avto na vlečno roko …');
        if (r.hookT >= K.HOOK) { r.stage = 'tow'; KIT.hold(P, false); r.say(this.hint); }
        this.pose(r, Math.min(1, r.hookT / K.HOOK)); this.show(r); return;
      }
      const v = Math.hypot(P.vx || 0, P.vz || 0), ch = Math.cos(P.h), sh = Math.sin(P.h), vf = (P.vx || 0) * ch + (P.vz || 0) * sh;
      // the strap: tighter the harder the truck slows (its own speed's change, a knock into a wall too) and the faster it goes
      const a = (vf - r.vf) / Math.max(1e-3, dt); r.vf = vf;
      r.acc += (a - r.acc) * Math.min(1, dt * 6);
      r.vHi = Math.max(v, (r.vHi || 0) - dt * K.VHD);   // (the speed the braking started from: the jolt, kept a while)
      const want = 0.12 + 0.95 * Math.min(1.4, Math.max(0, -r.acc) / K.DREF) * Math.min(1.5, Math.max(0.3, r.vHi / K.VREF));
      r.ten += (want - r.ten) * Math.min(1, dt * (want > r.ten ? 3 : 1.5));
      if (r.ten > K.RED) { r.red += dt; if (r.red > K.SNAP) { r.fail(tr('Vrv se je strgala: avto je zdrsnil po bregu.')); return; } } else r.red = Math.max(0, r.red - dt * 0.5);
      // the car behind: swung out in a bend too fast, knocked when the truck hits
      const lat = v * Math.abs(P.w || 0);
      if (lat > K.LAT) r.dmg += (lat - K.LAT) * K.SWING * dt;
      const hit = Math.max(P.hitWall || 0, P.hitCar || 0); if (hit > K.HIT) r.dmg += hit * K.HITK;
      r.swing += ((lat > K.LAT ? -Math.sign(P.w || 0) * Math.min(0.25, (lat - K.LAT) * 0.08) : 0) - r.swing) * Math.min(1, dt * 3);
      if (r.dmg >= 1) { r.dmg = 1; this.show(r); r.fail(tr('Pokvarjeni avto je preveč poškodovan.')); return; }
      // the truck's path for the car behind
      const h = this.hitch(P, T), L = r.trail, lp = L[L.length - 1];
      if (!lp || Math.hypot(h.x - lp.x, h.z - lp.z) > 0.4) { L.push(h); if (L.length > 60) L.shift(); }
      this.pose(r, 1);
      if (q.s <= r.end0) { r.win(); this.show(r); return; }
      r.say(r.ten > K.RED ? 'Vrv je prenapeta: spusti zavoro!' : lat > K.LAT ? 'Prehitro skozi ovinek: avto zadaj zanaša.' : v > K.VREF * 1.15 ? 'Prehitro: pred ovinkom boš moral močno zavirati.' : this.hint);
      this.show(r);
    },
    finish(r) { r.win(); },
    show(r) {
      const T = r.race.track, s = r.P.q ? r.P.q.s : T.finishS, ten = Math.min(1, r.ten);
      r.set('vrv', Math.round(ten * 100) + ' %', ten, r.ten > K.RED ? '#e8452c' : r.ten > 0.65 ? '#ffb020' : '#3fbf6a');
      r.set('skoda', Math.round(r.dmg * 100) + ' %', r.dmg, '#e8452c');
      r.set('dolina', dec((Math.max(0, s - r.end0) / 1000).toFixed(1)) + ' km');
    },
    // the tests' and the pictures' driver: down the road, gently (tools/misija-slika.mjs)
    pilot(r, o) { return KIT.pilot(r.P, r.race.track, Object.assign({ dir: -1, v: 11.5, lat: 2.6 }, o)); },
  });
})();
