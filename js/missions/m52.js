/* Special mission 52 · Hiša na tovornjaku · Big Sur, ZDA (js/missions.js; the kit: js/missions/kit.js). A prefabricated house on a low
   trailer behind a tractor (the racing truck's physics for the tractor, MisKit.skin; the trailer on its own kinematics, MisKit.trailer, drawn
   with MisKit.tow) along the narrow coast road to the finish line. The house is K.W m wide (ŠIRINA TOVORA), almost the road: it may stand
   K.OVER m out over the road's edge (over the barriers and the verge), on the narrow bridges (the track's def.narrow) not at all. PROSTOR: the room left and right of the house (its corners at K.CORN m behind the
   hitch). A corner out past it: a scrape (each new one costs the house a third: HIŠA; the third: failed). Two escort cars (MisKit.pilot)
   go with it: one ahead stops the oncoming cars, who wait by the left edge (K.WAIT; PROMET ČAKA: how many ahead), one behind. */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js');
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s);
  const dec = (s) => (typeof Lang !== 'undefined' && Lang.dec ? Lang.dec(s) : String(s).replace('.', ','));
  const K = { W: 6.4, OVER: 0.7, HITCH: 2.2, LEN: 13, CORN: [1.2, 7, 12.6], VMAX: 40, HURT: 1 / 3, AHEAD: 45, BEHIND: 28, SEE: 400,
    WAIT: [600, 1440, 1880, 2330, 2900, 3480] };
  const CAB = 0x2a4f8a, GLS = 0x1d2733, BLK = 0x1b1d21, GRY = 0x9aa1a8, WALL = 0xe9e2d0, ROOF = 0x6a4a3a, YEL = 0xf2c12e;

  // the tractor (x forward from its centre): a long-nose cab, the fifth wheel at the back
  function tractor(B) {
    B.box(2.3, 1.35, 0, 1.9, 1.1, 2.3, CAB); B.box(0.6, 1.95, 0, 1.6, 2.4, 2.45, CAB); B.box(1.42, 2.4, 0, 0.04, 0.8, 2.2, GLS);
    B.box(0.4, 3.3, 0, 1.2, 0.3, 2.3, YEL); B.box(-1.8, 0.95, 0, 2.6, 0.3, 1.2, BLK); B.box(-2.2, 1.15, 0, 1.2, 0.15, 1.6, GRY);
    for (const x of [2.4, -1.6, -2.9]) for (const sd of [-1, 1]) B.cyl(x, 0.52, sd * 1.05, 0.52, 0.4, BLK);
    B.box(3.26, 1.0, 0.85, 0.04, 0.22, 0.4, 0xfff4cc); B.box(3.26, 1.0, -0.85, 0.04, 0.22, 0.4, 0xfff4cc);
  }
  // the trailer with the house (x forward from the hitch): the low bed, the axles, the house with its gable roof, windows, the door, the
  // yellow-black boards of a wide load at its corners
  function load(B) {
    B.box(-6.6, 1.0, 0, 13.4, 0.3, 2.5, BLK); B.box(-0.4, 1.25, 0, 0.8, 0.5, 2.5, BLK);
    for (const x of [-11.6, -12.8, -14.0]) for (const sd of [-1, 1]) B.cyl(x, 0.5, sd * 1.0, 0.5, 0.36, BLK);
    B.box(-6.9, 2.85, 0, 11.4, 3.0, K.W, WALL);
    const R = new THREE.Matrix4();
    for (const sd of [-1, 1]) { R.makeRotationX(sd * 0.42); R.setPosition(-6.9, 4.95, sd * K.W / 4); B.L.push({ g: new THREE.BoxGeometry(11.8, 0.16, K.W / 2 / Math.cos(0.42) + 0.3), m: R.clone(), c: ROOF }); }
    for (const sd of [-1, 1]) { for (const x of [-3.2, -6.0, -9.6]) B.box(x, 3.1, sd * (K.W / 2 + 0.02), 1.5, 1.1, 0.04, GLS); B.box(-7.8, 2.5, sd * (K.W / 2 + 0.02), 1.0, 2.0, 0.05, 0x7a5a3a); }
    for (const x of [-1.15, -12.65]) for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) B.box(x + (x > -5 ? 0.02 : -0.02), 1.7 + k * 0.5, sd * (K.W / 2 - 0.4), 0.04, 0.25, 0.8, k % 2 ? BLK : YEL);
    B.box(-14.6, 1.0, 1.0, 0.04, 0.25, 0.25, 0xff3a2a); B.box(-14.6, 1.0, -1.0, 0.04, 0.25, 0.25, 0xff3a2a);
  }
  // the waiting cars (one mesh): a car's body and glass each, by the left edge facing us, their hazard lights
  function waiting(T, list) {
    const B = KIT.parts(), cols = [0xd8282a, 0xeeeeee, 0x2a5ab8, 0x30343a, 0x3a7a4a, 0xc9b38a];
    const x0 = list[0].x, z0 = list[0].z, y0 = list[0].y;
    list.forEach((c, k) => { const M = new THREE.Matrix4().makeRotationY(-c.h); M.setPosition(c.x - x0, c.y - y0 + 0.7, c.z - z0); B.L.push({ g: new THREE.BoxGeometry(4.4, 0.9, 1.8), m: M, c: cols[k % cols.length] });
      const M2 = new THREE.Matrix4().makeRotationY(-c.h); M2.setPosition(c.x - x0, c.y - y0 + 1.35, c.z - z0); B.L.push({ g: new THREE.BoxGeometry(2.4, 0.5, 1.62), m: M2, c: GLS }); });
    const g = new THREE.Group(); g.add(B.mesh(new THREE.MeshLambertMaterial({ vertexColors: true }))); g.position.set(x0, y0, z0);
    return g;
  }

  Missions.add({
    id: '52', title: 'Hiša na tovornjaku', track: 'bigsur', limit: 600, stars: [410, 480], K,
    story: 'Montažna hiša potuje po ozki obalni cesti. Široka je skoraj kot vsa cesta.',
    goal: 'Pripelji hišo do cilja brez praske. Spremljevalni avto ustavlja promet, most prevozi po sredini.',
    hint: 'Spremljevalni avto ustavlja promet; most prevozi po sredini.',
    rows: [{ k: 'sirina', label: 'ŠIRINA TOVORA' }, { k: 'prostor', label: 'PROSTOR' }, { k: 'promet', label: 'PROMET ČAKA' }, { k: 'hisa', label: 'HIŠA', bar: true }],
    // alone (the road closed by the escorts) by day; the tractor: the racing truck's physics, slow
    opts: () => ({ tt: true, laps: 1, playerModel: KIT.truckModel('titan', { vLim: K.VMAX, kw: 380, len: 6.8, wid: 2.5, mass: 24000 }), playerColor: CAB, damage: 0 }),
    begin(r) {
      const T = r.race.track, P = r.P;
      r.tr = KIT.trailer(P, { hitch: K.HITCH, len: K.LEN }); r.hp = 1; r.scr = 0; r.touch = false; r.room = [9, 9];
      r.cars = K.WAIT.map((s0) => { const s = T.startS + s0, i = T.idx(s), off = -(T.wS(s) - 1.0); return { s, x: T.px[i] + T.nx[i] * off, z: T.pz[i] + T.nz[i] * off, y: T.hy[i], h: Math.atan2(T.tz[i], T.tx[i]) + Math.PI, L: 4.4, W: 1.8 }; });
      if (typeof THREE !== 'undefined' && typeof document !== 'undefined') {
        r.skin = KIT.skin(r, P, tractor);
        if (r.skin) { const v = Render.viewOf(P); if (v && v.lights && v.lights.length >= 4) { v.lights[0].set(3.28, 1.0, -0.85); v.lights[1].set(3.28, 1.0, 0.85); v.lights[2].set(-14.6 - K.HITCH, 1.0, -1.0); v.lights[3].set(-14.6 - K.HITCH, 1.0, 1.0); } }
        r.towG = KIT.tow(r, P, r.tr, load);
        r.add(waiting(T, r.cars));
        r.front = KIT.pilot(r, T); r.back = KIT.pilot(r, T, { col: 0xf2c12e });
        r.tags = KIT.tags(r);
      }
      r.room = this.room(r);
      this.show(r);
    },
    // the room beside the house: how far each side's corners stay inside what they may reach (the road's edge + K.OVER; a narrow bridge
    // its parapet)
    room(r) {
      const T = r.race.track, R = r.tr, ch = Math.cos(R.h), sh = Math.sin(R.h), nx = -sh, nz = ch, out = [9, 9];
      for (const u of K.CORN) {
        const [cx, cz] = R.at(u);
        for (const sd of [-1, 1]) {
          const x = cx + nx * sd * K.W / 2, z = cz + nz * sd * K.W / 2, q = T.query(x, z, T.idx(r.P.q.s - u), {}), s = q.s - T.startS;
          let lim = T.wS(q.s) + K.OVER;
          for (const [a, b] of T.def.narrow || []) if (s > a - 2 && s < b + 2) lim = T.wS(q.s);
          const k = q.d < 0 ? 0 : 1; out[k] = Math.min(out[k], lim - Math.abs(q.d));
        }
      }
      return out;
    },
    step(r, dt) {
      const P = r.P, T = r.race.track, q = P.q; if (!q) return;
      r.tr.step(0);
      // the trailer's slope from the ground under its axle
      { const [ax, az] = r.tr.at(K.LEN), qa = T.query(ax, az, T.idx(q.s - K.LEN), {}); r.tr.pitch = -Math.atan2(T.hy[T.idx(qa.s)] - T.hy[T.idx(q.s)], K.LEN + K.HITCH); }
      r.room = this.room(r);
      const touch = Math.min(r.room[0], r.room[1]) < 0;
      if (touch && !r.touch) { r.scr++; r.hp = Math.max(0, 1 - r.scr * K.HURT); r.hitT = 1.5; }
      r.touch = touch;
      // a knock into a waiting car with the tractor
      for (const c of r.cars) if (Math.abs(c.s - q.s) < 12 && KIT.block(P, c) > 1 && !r.inC) { r.scr++; r.hp = Math.max(0, 1 - r.scr * K.HURT); r.hitT = 1.5; r.inC = true; }
      if (!r.cars.some(c => Math.abs(c.s - q.s) < 12)) r.inC = false;
      if (r.hitT > 0) r.hitT -= dt;
      if (r.hp <= 0.001) { r.fail(tr('Hiša je preveč poškodovana.')); this.show(r); return; }
      // the escorts: ahead and behind on the road, their beacons going
      if (r.front) { r.front.put(Math.min(T.startS + T.raceLen + 30, q.s + K.AHEAD), 0, 1, r.t); r.back.put(Math.max(T.startS - 20, q.s - K.HITCH - K.LEN - K.BEHIND), 0, 1, r.t + 0.3); }
      r.wait = r.cars.filter(c => c.s - q.s > -10 && c.s - q.s < K.SEE).length;
      if (r.tags) {
        const L = []; for (const c of r.cars) if (c.s - q.s > 10 && c.s - q.s < 160) L.push({ x: c.x, y: c.y + 2.6, z: c.z, html: '<b>' + tr('ČAKA') + '</b>', cls: '' });
        for (const [a, b] of T.def.narrow || []) { const s = T.startS + a; if (s - q.s > 0 && s - q.s < 250) { const i = T.idx(s); L.push({ x: T.px[i], y: T.hy[i] + 4, z: T.pz[i], html: '<b>' + tr('MOST') + '</b>' + tr('po sredini'), cls: 'go' }); } }
        r.tags.set(L);
      }
      const onBr = (T.def.narrow || []).some(([a, b]) => q.s - T.startS > a - 40 && q.s - T.startS < b);
      r.say(r.hitT > 0 ? 'Praska! Hiša je zadela rob.' : Math.min(r.room[0], r.room[1]) < 0.3 ? (r.room[0] < r.room[1] ? 'Premalo prostora na levi: bolj desno.' : 'Premalo prostora na desni: bolj levo.') : onBr ? 'Most prevozi po sredini.' : this.hint);
      this.show(r);
    },
    show(r) {
      r.set('sirina', dec(K.W.toFixed(1)) + ' m');
      const f = (v) => v >= 9 ? '—' : (v < 0 ? '−' : '') + dec(Math.abs(v).toFixed(1));
      r.set('prostor', 'L ' + f(r.room[0]) + ' · D ' + f(r.room[1]));
      r.set('promet', String(r.wait || 0));
      r.set('hisa', Math.round(r.hp * 100) + ' %', r.hp, r.hp > 0.6 ? '#3fbf6a' : r.hp > 0.3 ? '#ffb020' : '#e8452c');
    },
  });
})();
