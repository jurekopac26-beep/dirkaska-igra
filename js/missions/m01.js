/* Special mission 01 · Požar na vrhu · Vršič, Slovenija (js/missions.js; the kit: js/missions/kit.js). A house near the top of the pass is
   on fire: the fire engine C (an aerial ladder, MisKit.fireTruck, on the racing truck's physics with its own limiter) starts on the
   hairpins K.S0 m below it and must get there before the house burns down. On the way the fire grows (K.GROW a second) and the house
   burns faster the bigger it is. Within K.NEAR m of the house the crew sprays while the truck may still drive (the user's choice, 30. 10.):
   the ladder rises a little and turns to the house, the finger aims the stream over the road (MisKit.aim, drive: a wall through the
   house facing the camera, the driving controls kept), GASI held sprays it (K.FLOW l/s from K.WATER l, within K.RANGE m of the truck);
   the camera turns toward the house (MisKit.look, the more the slower the truck). The water anywhere on the house (within K.R m of a
   flame or its middle) puts the whole fire out in K.OUTT s; not on it, the fire grows back (K.BACK). The house at 0 %, the water gone
   while it still burns or the time up: failed. Driven past the finish (150 m past the house): failed. */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js');
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s), dec = (s) => (typeof Lang !== 'undefined' ? Lang.dec(s) : String(s));
  const K = { S0: 4200, HOUSE: 150, NEAR: 70, RANGE: 40, LOOK: 0.6, VLOOK: 9, F0: 0.3, GROW: 0.004, BURN: 0.0028, WATER: 1500, FLOW: 25, OUTT: 5, R: 5, BACK: 0.012, OUT: 0.03, SPOTS: 6 };

  Missions.add({
    id: '01', title: 'Požar na vrhu', track: 'vrsic', limit: 330, stars: [230, 280], K,
    story: 'V hiši na vrhu prelaza gori. Gasilci morajo po serpentinah gor, preden ogenj požre hišo.',
    goal: 'Pridi do hiše, preden zgori, in pogasi ogenj.',
    hint: 'Pelji po serpentinah do hiše na vrhu prelaza.',
    rows: [{ k: 'hisa', label: 'HIŠA', bar: true, col: '#e8452c' }, { k: 'ogenj', label: 'OGENJ', bar: true, col: '#ffa020' }, { k: 'voda', label: 'VODA', bar: true, col: '#3d8cff' }],
    // alone on the closed road, dry, by day; the fire engine (the racing truck's physics, slower: K in truckModel)
    opts: () => ({ tt: true, playerModel: KIT.truckModel('titan', { vLim: 105, kw: 560, len: 8.4 }), playerColor: 0xc4161c, damage: 0 }),
    // the truck starts K.S0 m below the house, on the hairpins
    made(race) {
      const T = race.track, c = race.player; if (!c) return;
      const s = T.finishS - K.HOUSE - K.S0, i = T.idx(s);
      c.place(T.px[i], T.pz[i], T.hd[i]); if (T.hasElev) { c.y = c.py = T.hy[i]; c.roadY = c.y; }
      c.dist = s - T.startS; c.q = T.query(T.px[i], T.pz[i], i, {}); c.sPrev = c.q.s;
      while (c.cp < T.cpS.length && c.dist >= T.cpDist[c.cp]) { c.splits.push(0); c.cp++; }
    },
    begin(r) {
      const T = r.race.track, sH = T.finishS - K.HOUSE, i = T.idx(sH), side = T.br[i] >= T.bl[i] ? 1 : -1, w = T.wS(sH);
      r.sH = sH; r.house = 1; r.water = K.WATER; r.f = K.F0; r.stage = 'drive'; r.fl = new Array(K.SPOTS).fill(K.F0);
      const p = KIT.at(T, sH, side * (w + 4.5));
      r.H = KIT.house(r, { x: p.x, y: Math.max(p.y, p.ty) - 0.1, z: p.z }, { ry: p.ry });
      r.truck = KIT.fireTruck(r); r.fire = KIT.fire(r, K.SPOTS); r.jet = KIT.jet(r);
      r.aim = KIT.aim(r, { plane: 'v', drive: true, focus: typeof THREE !== 'undefined' ? new THREE.Vector3(r.H.center.x, r.H.center.y, r.H.center.z) : null });
      this.flames(r); this.show(r);
    },
    flames(r) { r.H.fl.forEach((p, k) => r.fire.spot(k, p[0], p[1], p[2], r.fl[k] > K.OUT ? 3 + 5 * r.fl[k] : 0)); },
    step(r, dt) {
      const P = r.P, s = P.q ? P.q.s : 0, d = s - r.sH, v = Math.hypot(P.vx || 0, P.vz || 0), H = r.H.center;
      const far = Math.hypot(H.x - P.x, H.z - P.z), near = far < K.NEAR;
      // near the house: the crew sprays (the finger's pad over the road, GASI over the pedals: the truck may drive on), the ladder up toward it,
      // the camera turned toward it the more, the slower the truck
      if (r.stage !== 'done') { if (near !== (r.stage === 'fight')) { r.stage = near ? 'fight' : 'drive'; r.aim.on(near); } }
      KIT.look(r, near && r.stage !== 'done' ? H : null, K.LOOK * Math.max(0, 1 - v / K.VLOOK), dt);
      const tk = r.truck, up = r.stage === 'fight';
      tk.lift += ((up ? 0.32 : 0) - tk.lift) * Math.min(1, dt * 1.5); tk.ext += ((up ? 0.1 : 0) - tk.ext) * Math.min(1, dt * 1.5);
      tk.yaw += ((up ? tk.yawTo(H.x, H.z) : 0) - tk.yaw) * Math.min(1, dt * 2);
      let spray = false, pt = null;
      if (r.stage === 'fight') {
        if (r.aim.o.focus && r.aim.o.focus.set) r.aim.o.focus.set(H.x, H.y, H.z);
        r.aim.step();
        pt = r.autoSpray || r.aim.point;
        const reach = pt && Math.hypot(pt.x - P.x, pt.z - P.z) < K.RANGE;
        spray = (r.aim.spray || !!r.autoSpray) && r.water > 0 && reach;
        if (spray) r.water = Math.max(0, r.water - K.FLOW * dt);
        // the water on the house (anywhere within K.R of a flame or its middle): the whole fire down, out in K.OUTT s of water
        const hit = spray && (Math.hypot(H.x - pt.x, H.y - pt.y, H.z - pt.z) < K.R || r.H.fl.some(p => Math.hypot(p[0] - pt.x, p[1] - pt.y, p[2] - pt.z) < K.R));
        r.f = hit ? Math.max(0, r.f - dt / K.OUTT) : Math.min(1, r.f + K.BACK * dt);
        if (r.f < K.OUT) r.f = 0;
        r.say(r.water <= 0 ? 'Voda je pošla.' : (r.aim.spray || r.autoSpray) && !reach ? 'Predaleč: curek ne seže do tja.' : 'Povleci s prstom, da usmeriš curek na ogenj, in drži GASI.');
        if (r.f <= 0) { r.stage = 'done'; r.aim.on(false); r.win(); }
        else if (r.water <= 0) r.fail(tr('Zmanjkalo je vode.'));
      } else if (r.stage === 'drive') {
        r.f = Math.min(1, r.f + K.GROW * dt);
        r.say(d > 10 ? 'Hišo si zgrešil: vrni se nazaj do nje.' : tr('Do hiše na vrhu: {0} km', dec((Math.max(0, -d) / 1000).toFixed(1))));
      }
      if (r.jet) r.jet.set(r.truck.nozzle ? r.truck.nozzle() : null, pt, spray);
      r.fl.fill(r.f);
      // the house burns with the fire
      if (r.stage !== 'done') { r.house = Math.max(0, r.house - K.BURN * r.f * dt); if (r.house <= 0) r.fail(tr('Hiša je zgorela.')); }
      this.flames(r); r.H.burn(1 - r.house, r.f); r.fire.step(dt); if (r.jet) r.jet.step(dt); tk.step(dt, r.stage !== 'done');
      this.show(r);
    },
    // driven over the finish (past the house): not done
    finish(r) { r.fail(tr('Zapeljal si mimo hiše.')); },
    show(r) {
      const h = r.house, col = h > 0.5 ? '#3fbf6a' : h > 0.25 ? '#ffb020' : '#e8452c';
      r.set('hisa', Math.round(h * 100) + ' %', h, col);
      r.set('ogenj', Math.round(r.f * 100) + ' %', r.f);
      r.set('voda', Math.round(r.water) + ' l', r.water / K.WATER);
    },
  });
})();
