/* Special mission 53 · Snežne verige · Los Caracoles, Čile (js/missions.js; the kit: js/missions/kit.js). It is snowing and the pass is
   about to close: a coach with 46 people (MisKit.skin over the racing truck's physics, its own limiter K.VMAX) stands K.S0 m past the start
   line below the ladder of hairpins. First the chains: the coach held, the driver fits them wheel by wheel (NAMESTI VERIGO held for
   K.FIT s a wheel; let go early, that wheel starts again); then up the snowy road (MisKit.cover; the chains' tracks behind the rear wheels,
   MisKit.band) to the barrier before the avalanche gallery (K.END m past the start line) before it closes (the limit: failed, the pass
   closed). On the snow the grip (OPRIJEM) goes with the driving: full throttle at a low speed spins the wheels (the drive lost: it climbs
   slower), too fast through a bend (the sideways pull over K.LAT m/s2) slides it (its grip lost, MisKit's xgl). On the way a truck that
   had no chains lies across the right half of the road (a box the coach bumps into, MisKit.block; its hazard lights, a tag). A hard knock
   (over K.HIT m/s, into the truck over K.HITT m/s): failed, the passengers hurt. */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js');
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s);
  const K = { S0: 2120, END: 6860, TRUCK: 3580, VMAX: 45, FIT: 1.6, LAT: 4.0, SPIN: 10, HIT: 7, HITT: 4, PAX: 46, RX: -3.6 };
  const BLU = 0x1f4fa0, WH = 0xf1f3f5, GLS = 0x1d2733, BLK = 0x1b1d21, GRY = 0x9aa1a8, ROOF = 0xd6dade;

  // the coach: 12 m, white with a blue band, the windows' band, the roof with its air unit, three axles (x forward, y up, z to the side)
  function coach(B) {
    B.box(0, 2.05, 0, 12.0, 2.9, 2.55, WH); B.box(0, 1.0, 0, 12.02, 0.55, 2.57, BLU);
    for (const sd of [-1, 1]) B.box(0.3, 2.55, sd * 1.285, 10.6, 1.0, 0.02, GLS);
    B.box(6.01, 2.4, 0, 0.04, 1.5, 2.3, GLS); B.box(-6.01, 2.75, 0, 0.04, 0.8, 2.2, GLS);
    B.box(0, 3.53, 0, 11.8, 0.06, 2.45, ROOF); B.box(-1.5, 3.75, 0, 3.0, 0.4, 1.8, GRY);
    B.box(6.02, 1.0, 0.9, 0.04, 0.22, 0.4, 0xfff4cc); B.box(6.02, 1.0, -0.9, 0.04, 0.22, 0.4, 0xfff4cc);
    B.box(-6.02, 1.1, 1.0, 0.04, 0.3, 0.25, 0xff3a2a); B.box(-6.02, 1.1, -1.0, 0.04, 0.3, 0.25, 0xff3a2a);
    for (const x of [4.3, K.RX, K.RX - 1.35]) for (const sd of [-1, 1]) { B.cyl(x, 0.52, sd * 1.05, 0.52, 0.38, BLK); B.cyl(x, 0.52, sd * 1.25, 0.53, 0.03, GRY); }
  }
  // the truck across the road: its cab and trailer, its hazard lights (two meshes: one side, then the other)
  function wreck() {
    const B = KIT.parts();
    B.box(5.6, 1.6, 0, 2.2, 2.6, 2.5, 0x2a4f8a); B.box(6.71, 2.0, 0, 0.04, 0.9, 2.2, GLS);
    B.box(-0.6, 2.05, 0, 9.8, 2.9, 2.55, 0xe4e6e9); B.box(0, 0.65, 0, 13.4, 0.4, 1.9, BLK);
    for (const x of [5.6, 3.6, -3.6, -4.9]) for (const sd of [-1, 1]) B.cyl(x, 0.52, sd * 1.05, 0.52, 0.36, BLK);
    B.box(-0.6, 3.52, 0, 9.6, 0.1, 2.4, 0xf5f7fa);
    const g = new THREE.Group(), m = B.mesh(new THREE.MeshLambertMaterial({ vertexColors: true })); m.castShadow = true; g.add(m);
    const on = new THREE.MeshBasicMaterial({ color: 0xffa21a }), off = new THREE.MeshLambertMaterial({ color: 0x5a3a10 });
    const L = KIT.parts(); for (const [x, z] of [[6.75, 1.0], [6.75, -1.0], [-5.52, 1.0], [-5.52, -1.0]]) L.box(x, 1.0, z, 0.06, 0.2, 0.3, 0);
    const lamps = new THREE.Mesh(KIT.merged(L.L), on); g.add(lamps);
    g.userData.blink = (t) => { lamps.material = (t * 1.6) % 1 < 0.5 ? on : off; };
    return g;
  }
  // the barrier at the end: two posts, the arm across the road (red and white), a sign
  function barrier(T, s) {
    const i = T.idx(s), w = T.wS(s) + 0.6, B = KIT.parts();
    const g = new THREE.Group();
    for (const sd of [-1, 1]) B.box(0, 0.6, sd * w, 0.3, 1.2, 0.3, 0x3a3e44);
    for (let k = 0; k < 8; k++) B.box(0, 1.15, -w + (k + 0.5) * (2 * w / 8), 0.16, 0.16, 2 * w / 8, k % 2 ? 0xffffff : 0xd8282a);
    B.box(0, 2.6, w + 0.4, 0.1, 1.2, 1.6, 0xd8282a); B.box(0, 1.6, w + 0.4, 0.12, 0.9, 0.12, 0x3a3e44);
    g.add(B.mesh(new THREE.MeshLambertMaterial({ vertexColors: true })));
    g.position.set(T.px[i], T.hy[i], T.pz[i]); g.rotation.y = -Math.atan2(T.tz[i], T.tx[i]);
    return g;
  }

  Missions.add({
    id: '53', title: 'Snežne verige', track: 'caracoles', limit: 570, stars: [440, 510], K,
    story: 'Sneži in prelaz bodo kmalu zaprli. Avtobus s 46 potniki mora čez.',
    goal: 'Namesti verige in pripelji avtobus čez serpentine, preden prelaz zaprejo.',
    hint: 'Na snegu vozi enakomerno: sunek plina zavrti kolesa tudi z verigami.',
    rows: [{ k: 'verige', label: 'VERIGE', bar: true, col: '#3fbf6a' }, { k: 'oprijem', label: 'OPRIJEM', bar: true }, { k: 'zapora', label: 'ZAPORA' }, { k: 'potniki', label: 'POTNIKI' }],
    // alone on the open road (closed for the others), snowing, by day; the coach: the racing truck's physics, slow, no damage
    opts: () => ({ tt: true, playerModel: KIT.truckModel('titan', { vLim: K.VMAX, kw: 330, len: 12.0, wid: 2.55, mass: 12000 }), playerColor: WH, damage: 0 }),
    made(race) {
      const T = race.track, c = race.player; if (!c) return;
      const s = T.startS + K.S0, i = T.idx(s);
      c.place(T.px[i], T.pz[i], T.hd[i]); if (T.hasElev) { c.y = c.py = T.hy[i]; c.roadY = c.y; }
      c.dist = s - T.startS; c.q = T.query(T.px[i], T.pz[i], i, {}); c.sPrev = c.q.s;
      while (c.cp < T.cpS.length && c.dist >= T.cpDist[c.cp]) { c.splits.push(0); c.cp++; }
    },
    begin(r) {
      const T = r.race.track, sEnd = T.startS + K.END, sTr = T.startS + K.TRUCK;
      r.chains = 0; r.fit = 0; r.stage = 'chains'; r.spin = 0; r.slide = 0; r.grip = 1; r.vf = 0; r.sEnd = sEnd;
      // the truck across the right half of the road (its middle 3.2 m right of the centre line, turned 30 degrees across it)
      { const i = T.idx(sTr), off = 3.2; r.wk = { x: T.px[i] + T.nx[i] * off, z: T.pz[i] + T.nz[i] * off, h: Math.atan2(T.tz[i], T.tx[i]) + 0.5, L: 13.4, W: 2.6, y: T.hy[i] }; }
      if (typeof Render !== 'undefined' && Render.setAtmos) Render.setAtmos({ season: 'winter', tod: 'day' }, true);
      if (typeof THREE !== 'undefined' && typeof document !== 'undefined') {
        KIT.cover(r, T, T.startS + K.S0 - 40, sEnd + 60, { w: 0.5, lift: 0.05 });
        r.ruts = [KIT.band(r, 4000, { tex: KIT.snowTex('ribs'), rep: 1.2, across: 1, col: 0x9fb0c2, order: 1 }), KIT.band(r, 4000, { tex: KIT.snowTex('ribs'), rep: 1.2, across: 1, col: 0x9fb0c2, order: 1 })];
        r.skin = KIT.skin(r, r.P, coach);
        if (r.skin) { const v = Render.viewOf(r.P); if (v && v.lights && v.lights.length >= 4) { v.lights[0].set(6.04, 1.0, -0.9); v.lights[1].set(6.04, 1.0, 0.9); v.lights[2].set(-6.04, 1.1, -1.0); v.lights[3].set(-6.04, 1.1, 1.0); } }
        r.wg = wreck(); r.wg.position.set(r.wk.x, r.wk.y, r.wk.z); r.wg.rotation.y = -r.wk.h; r.add(r.wg);
        r.add(barrier(T, sEnd));
        r.tags = KIT.tags(r);
        r.btn = KIT.button(r, 'NAMESTI VERIGO');
        if (r.btn.el) { const b = r.btn.el, up = () => { r.held = false; }; b.addEventListener('pointerdown', () => { r.held = true; }); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up); }
        r.btn.show(true);
      }
      this.show(r);
    },
    step(r, dt) {
      const P = r.P, T = r.race.track, q = P.q; if (!q) return;
      if (r.t >= r.def.limit) { r.fail(tr('Prelaz so zaprli, preden si prišel čez.')); return; }
      if (r.stage === 'chains') {
        KIT.hold(P); P.stuckT = 0;
        if (r.held || r.autoChain) { r.fit += dt / K.FIT; if (r.fit >= 1) { r.chains++; r.fit = 0; r.held = false; } } else r.fit = 0;
        if (r.chains >= 4) { r.stage = 'drive'; KIT.hold(P, false); if (r.btn) r.btn.show(false); r.say(this.hint); }
        else r.say('Drži NAMESTI VERIGO, da namestiš verigo na kolo.');
        if (r.btn && r.btn.label) r.btn.label(tr('NAMESTI VERIGO') + ' ' + (r.chains + 1) + ' / 4');
        this.show(r); return;
      }
      // the grip on the snow: the wheels spin at full throttle when slow, a bend too fast slides it
      const v = Math.hypot(P.vx || 0, P.vz || 0), ch = Math.cos(P.h), sh = Math.sin(P.h), vf = (P.vx || 0) * ch + (P.vz || 0) * sh;
      const want = (P.inThr || 0) * Math.max(0, 1 - v / K.SPIN) * 0.85;
      r.spin += (want - r.spin) * Math.min(1, dt * (want > r.spin ? 1.5 : 2.2));
      r.slide = Math.max(0, Math.min(1, (v * Math.abs(P.w || 0) - K.LAT) / 2.5));
      r.grip = 1 - Math.max(r.spin * 0.8, r.slide * 0.9);
      P.xgl = Math.max(P.xgl || 0, 0.08 + 0.75 * (1 - r.grip));
      if (vf > r.vf && r.spin > 0.05) { const lost = (vf - r.vf) * Math.min(0.85, r.spin); P.vx -= ch * lost; P.vz -= sh * lost; }   // (the wheels spinning: the drive lost)
      r.vf = (P.vx || 0) * ch + (P.vz || 0) * sh;
      // the truck across the road; a hard knock (it or the walls)
      const imp = Math.max(KIT.block(P, r.wk) * K.HIT / K.HITT, P.hitWall || 0, P.hitCar || 0);   // (the truck at a slant: a glancing blow into it counts more)
      if (imp > K.HIT) { r.fail(tr('Avtobus je močno trčil: potniki so poškodovani.')); return; }
      // the chains' tracks behind the rear wheels
      if (r.ruts && v > 0.5 && (!r.last || Math.hypot(P.x - r.last[0], P.z - r.last[1]) > 1.2)) {
        const y = T.hy[T.idx(q.s - 4)] + 0.08;
        [-1, 1].forEach((sd, k) => { const x = P.x + ch * K.RX - sh * 1.05 * sd, z = P.z + sh * K.RX + ch * 1.05 * sd; r.ruts[k].add(x, y, z, -sh * 0.3, ch * 0.3); });
        r.last = [P.x, P.z];
      }
      if (q.s >= r.sEnd) { r.win(); return; }
      if (r.wg) r.wg.userData.blink(r.t);
      if (r.tags) {
        const L = [], dW = r.wk && Math.hypot(r.wk.x - P.x, r.wk.z - P.z);
        if (dW < 250 && q.s < T.startS + K.TRUCK + 20) L.push({ x: r.wk.x, y: r.wk.y + 5, z: r.wk.z, html: '<b>' + tr('ZDRSNIL') + '</b>' + tr('brez verig'), cls: '' });
        const i = T.idx(r.sEnd); if (r.sEnd - q.s < 400) L.push({ x: T.px[i], y: T.hy[i] + 4, z: T.pz[i], html: '<b>' + tr('ZAPORA') + '</b>' + tr('galerija'), cls: 'go' });
        r.tags.set(L);
      }
      r.say(r.spin > 0.4 ? 'Kolesa se vrtijo v prazno: popusti plin.' : r.slide > 0.35 ? 'Avtobus drsi: počasneje skozi ovinek.' : Math.abs(q.s - (T.startS + K.TRUCK)) < 120 ? 'Tovornjak brez verig je obstal počez: zapelji mimo po levi.' : this.hint);
      this.show(r);
    },
    finish(r) { r.win(); },
    show(r) {
      r.set('verige', r.chains + ' / 4', r.stage === 'chains' ? r.fit : 1, r.chains >= 4 ? '#3fbf6a' : '#ffb020');
      r.set('oprijem', Math.round(r.grip * 100) + ' %', r.grip, r.grip > 0.6 ? '#3fbf6a' : r.grip > 0.35 ? '#ffb020' : '#e8452c');
      const left = Math.max(0, r.def.limit - r.t);
      r.set('zapora', left >= 60 ? tr('čez {0} min', Math.ceil(left / 60)) : tr('čez {0} s', Math.ceil(left)));
      r.set('potniki', String(K.PAX));
    },
  });
})();
