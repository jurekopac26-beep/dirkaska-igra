/* Special mission 01 · Požar na vrhu · Vršič, Slovenija (js/missions.js; the kit: js/missions/kit.js). A house near the top of the pass is
   on fire: the fire engine C (an aerial ladder, MisKit.fireTruck, on the racing truck's physics with its own limiter) starts on the
   hairpins K.S0 m below it and must get there before the house burns down. On the way the fire grows (K.GROW a second) and the house
   burns faster the bigger it is. Stopped in front of the house (K.ZONE metres of road before it), the truck is held, its ladder rises a
   little and turns to the house: the finger aims the stream (MisKit.aim, a wall through the house facing the camera), GASI held sprays
   it (K.FLOW l/s from K.WATER l). Each of the six flames (roof, windows) goes down where the water hits it (K.HIT a second within K.R m
   of the aim), the others grow again (K.BACK); all out: done. The house at 0 %, the water gone while it still burns or the time up:
   failed. Driven past the finish (150 m past the house): failed. */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js');
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s), dec = (s) => (typeof Lang !== 'undefined' ? Lang.dec(s) : String(s));
  const K = { S0: 4200, HOUSE: 150, ZONE: [-24, -6], VSTOP: 3, VHELP: 8.5, F0: 0.3, GROW: 0.004, BURN: 0.0028, WATER: 1500, FLOW: 25, HIT: 0.42, R: 3.4, BACK: 0.012, OUT: 0.03, SPOTS: 6 };

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
      r.aim = KIT.aim(r, { plane: 'v', focus: typeof THREE !== 'undefined' ? new THREE.Vector3(r.H.center.x, r.H.center.y, r.H.center.z) : null });
      this.flames(r); this.show(r);
    },
    flames(r) { r.H.fl.forEach((p, k) => r.fire.spot(k, p[0], p[1], p[2], r.fl[k] > K.OUT ? 3 + 5 * r.fl[k] : 0)); },
    step(r, dt) {
      const P = r.P, T = r.race.track, s = P.q ? P.q.s : 0, d = s - r.sH, v = Math.hypot(P.vx || 0, P.vz || 0);
      const lit = r.stage !== 'done';
      if (r.stage === 'drive') {
        r.f = Math.min(1, r.f + K.GROW * dt); r.fl.fill(r.f);
        const inZ = d >= K.ZONE[0] && d <= K.ZONE[1];
        if (inZ && v < K.VHELP) { const k = Math.exp(-dt * 2.5); P.vx *= k; P.vz *= k; }   // (in front of the house: the truck pulls up by itself)
        if (inZ && v < K.VSTOP) { r.stage = 'fight'; r.aim.on(true); if (r.aim.toFocus) r.aim.toFocus(); }
        r.say(inZ ? 'Ustavi pri hiši.' : d > 10 ? 'Hišo si zgrešil: vrni se nazaj do nje.' : tr('Do hiše na vrhu: {0} km', dec((Math.max(0, -d) / 1000).toFixed(1))));
      } else if (r.stage === 'fight') {
        KIT.hold(P);
        const tk = r.truck; tk.lift += (0.32 - tk.lift) * Math.min(1, dt * 1.5); tk.ext += (0.1 - tk.ext) * Math.min(1, dt * 1.5);
        if (typeof THREE !== 'undefined' && r.H.center) { const c = r.H.center, dx = c.x - P.x, dz = c.z - P.z, lx = dx * Math.cos(P.h) + dz * Math.sin(P.h), lz = -dx * Math.sin(P.h) + dz * Math.cos(P.h); tk.yaw += (Math.atan2(-lz, lx) - tk.yaw) * Math.min(1, dt * 2); }
        r.aim.step();
        const spray = (r.aim.spray || r.autoSpray) && r.water > 0, pt = r.autoSpray ? r.autoSpray : r.aim.point;
        if (spray) r.water = Math.max(0, r.water - K.FLOW * dt);
        let sum = 0;
        r.H.fl.forEach((p, k) => {
          if (r.fl[k] <= 0) return;
          const hit = spray && pt && Math.hypot(p[0] - pt.x, p[1] - pt.y, p[2] - pt.z) < K.R;
          r.fl[k] = hit ? r.fl[k] - K.HIT * dt : Math.min(1, r.fl[k] + K.BACK * dt);
          if (r.fl[k] < K.OUT) r.fl[k] = 0;
          sum += r.fl[k];
        });
        r.f = sum / K.SPOTS;
        if (r.jet && typeof THREE !== 'undefined') r.jet.set(r.truck.nozzle(), pt, spray);
        r.say(r.water <= 0 ? 'Voda je pošla.' : 'Povleci s prstom, da usmeriš curek na ogenj, in drži GASI.');
        if (r.f <= 0) { r.stage = 'done'; r.aim.on(false); KIT.hold(P, false); if (r.jet) r.jet.set(null, null, false); r.win(); }
        else if (r.water <= 0) r.fail(tr('Zmanjkalo je vode.'));
      }
      // the house burns with the fire
      if (r.stage !== 'done') { r.house = Math.max(0, r.house - K.BURN * r.f * dt); if (r.house <= 0) r.fail(tr('Hiša je zgorela.')); }
      this.flames(r); r.H.burn(1 - r.house, r.f); r.fire.step(dt); if (r.jet) r.jet.step(dt); r.truck.step(dt, lit);
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
