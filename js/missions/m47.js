/* Special mission 47 · Gozdni požar · Great Alpine Road, Avstralija (js/missions.js; the kit: js/missions/kit.js). The wind drives a
   bushfire down the slope toward the road; past the road is a farm. The fire's edge is a row of K.N cells along K.LEN m of road on one
   side (each its distance from the road's edge and its strength), creeping toward the road with the wind (K.CREEP m/s at full strength),
   growing back slowly where the water is not. The fire engine (MisKit.fireTruck) sprays while it drives slowly (under K.VMAX m/s): the
   finger aims over the road (MisKit.aim, drive: the driving controls stay), GASI held sprays within K.RANGE m of the nozzle (K.FLOW l/s);
   a cell within K.R m of where the water lands goes down by K.HIT a second, out under K.OUT. Out of water: the pond on the farm (stopped
   beside it, it fills at K.FILL l/s). A cell reaching the road while still burning: the fire jumps it, failed; every cell out: done.
   Three kangaroos hop along the farm's paddock. The panel: the water, how far the fire is from the house (the nearest cell, over the road to the house), the wind, the share put out. */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js');
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s), dec = (s) => (typeof Lang !== 'undefined' ? Lang.dec(s) : String(s));
  const K = { S0: 1700, LEN: 900, N: 30, D0: [14, 30], F0: [0.55, 1], CREEP: 0.035, BACK: 0.01, VMAX: 8.4, RANGE: 38, R: 7, HIT: 0.55, OUT: 0.05,
    WATER: 1500, FLOW: 30, FILL: 160, POND: 520, PZONE: [-25, 25], HOUSE: 560, HOFF: 48, WIND: 35 };

  Missions.add({
    id: '47', title: 'Gozdni požar', track: 'greatalpine', limit: 540, stars: [330, 420], K,
    story: 'Veter žene ogenj po pobočju navzdol proti kmetiji. Cesta je zadnja ovira pred hišo.',
    goal: 'Ustavi ogenj pred kmetijo; vodo natoči v jezercu.',
    hint: 'Gasi rob ognja ob cesti; ko zmanjka vode, jo natoči v jezercu.',
    rows: [{ k: 'voda', label: 'VODA', bar: true, col: '#3d8cff' }, { k: 'hisa', label: 'OGENJ DO HIŠE' }, { k: 'veter', label: 'VETER' }, { k: 'pog', label: 'POGAŠENO', bar: true, col: '#3fbf6a' }],
    // alone on the closed road, at dusk; the fire engine (the racing truck's physics, slower)
    opts: () => ({ tt: true, playerModel: KIT.truckModel('titan', { vLim: 105, kw: 560, len: 8.4 }), playerColor: 0xc4161c, damage: 0 }),
    begin(r) {
      const T = r.race.track, s1 = T.startS + K.S0, im = T.idx(s1 + K.LEN / 2), side = T.br[im] >= T.bl[im] ? 1 : -1;   // (the fire on the roomier side, the farm on the other)
      r.s1 = s1; r.side = side; r.water = K.WATER; r.stage = 'drive';
      // the cells: along the road, their distance from its edge and their strength (a fixed spread: the same fire every run)
      r.cells = [];
      for (let k = 0; k < K.N; k++) {
        const u = (k * 0.618034) % 1, v = (k * 0.414214) % 1, s = s1 + (k + 0.5) * K.LEN / K.N;
        r.cells.push({ s, d: K.D0[0] + (K.D0[1] - K.D0[0]) * u, f: K.F0[0] + (K.F0[1] - K.F0[0]) * v });
      }
      r.pos = (c) => { const i = T.idx(c.s), o = side * (T.wS(c.s) + c.d); const p = KIT.at(T, c.s, o); return p; };
      // the farm across the road: the house, the pond beside the road
      const sH = s1 + K.HOUSE, ph = KIT.at(T, sH, -side * (T.wS(sH) + K.HOFF));
      r.H = KIT.house(r, { x: ph.x, y: Math.max(ph.y, ph.ty - 2), z: ph.z }, { ry: ph.ry, L: 12, W: 8, roof: 0x8f949a, wall: 0xe9e2d2 });
      r.sP = s1 + K.POND; r.pond = KIT.at(T, r.sP, -side * (T.wS(r.sP) + 12));
      if (typeof THREE !== 'undefined') {
        const g = new THREE.Mesh(new THREE.CircleGeometry(9, 28), new THREE.MeshLambertMaterial({ color: 0x3f6f8a })); g.rotation.x = -Math.PI / 2; g.position.set(r.pond.x, Math.max(r.pond.y, r.pond.ty - 1) + 0.12, r.pond.z); r.add(g);
        const rim = new THREE.Mesh(new THREE.RingGeometry(9, 10.5, 28), new THREE.MeshLambertMaterial({ color: 0x8a7a55 })); rim.rotation.x = -Math.PI / 2; rim.position.copy(g.position); rim.position.y -= 0.02; r.add(rim);
      }
      // three kangaroos fleeing the fire over the farm's paddock: a body, a tail, a head, hopping (one mesh each)
      r.roos = [];
      if (typeof THREE !== 'undefined') for (let k = 0; k < 3; k++) {
        const B = KIT.parts(), C = 0x9a6b45; B.box(0, 0.75, 0, 0.9, 0.55, 0.45, C); B.box(0.45, 1.15, 0, 0.3, 0.3, 0.25, C); B.box(-0.75, 0.45, 0, 0.9, 0.16, 0.16, 0x8a5e3c); B.box(0.1, 0.25, 0, 0.5, 0.5, 0.3, 0x8a5e3c);
        const m = B.mesh(new THREE.MeshLambertMaterial({ vertexColors: true })); m.castShadow = true; r.add(m);
        r.roos.push({ m, s: r.sP - 60 + k * 14, o: -side * (T.wS(r.sP) + 26 + k * 6), ph: k * 0.37 });
      }
      r.truck = KIT.fireTruck(r); r.fire = KIT.fire(r, K.N, { per: 9, spread: 3 }); r.jet = KIT.jet(r);
      r.aim = KIT.aim(r, { plane: 'g', drive: true, focus: typeof THREE !== 'undefined' ? new THREE.Vector3() : null });
      if (typeof Render !== 'undefined' && Render.setAtmos) Render.setAtmos({ season: 'summer', tod: 'dusk' }, true);
      this.flames(r); this.show(r);
    },
    flames(r) { r.cells.forEach((c, k) => { const p = r.pos(c); c.x = p.x; c.y = p.y; c.z = p.z; r.fire.spot(k, p.x, p.y, p.z, c.f > K.OUT ? 3.5 + 4.5 * c.f : 0); }); },
    step(r, dt) {
      const P = r.P, T = r.race.track, s = P.q ? P.q.s : 0, v = Math.hypot(P.vx || 0, P.vz || 0);
      // the fire creeps toward the road, grows back
      let near = 1e9, out = 0;
      for (const c of r.cells) {
        if (c.f <= 0) { out++; continue; }
        c.d -= K.CREEP * (0.4 + 0.6 * c.f) * dt; c.f = Math.min(1, c.f + K.BACK * dt);
        near = Math.min(near, c.d);
        if (c.d <= 0) { r.fail(tr('Ogenj je preskočil cesto.')); break; }
      }
      // the pond: stopped beside it, the tank fills
      const dp = s - r.sP, atPond = dp >= K.PZONE[0] && dp <= K.PZONE[1];
      if (atPond && v < 1.5 && r.water < K.WATER) { r.water = Math.min(K.WATER, r.water + K.FILL * dt); r.filling = true; } else r.filling = false;
      // the water: the finger's aim, within reach of the nozzle, slowly enough
      const A = r.aim; if (A.o.focus && A.o.focus.set) A.o.focus.set(P.x, P.y || 0, P.z); A.step();
      const pt = r.autoSpray || A.point, noz = r.truck.nozzle ? r.truck.nozzle() : null;
      const reach = pt && Math.hypot(pt.x - P.x, pt.z - P.z) < K.RANGE;   // (from the truck: its drawn nozzle may lag a step behind)
      const spray = (A.spray || !!r.autoSpray) && r.water > 0 && v < K.VMAX && reach;
      if (spray) {
        r.water = Math.max(0, r.water - K.FLOW * dt);
        for (const c of r.cells) if (c.f > 0 && Math.hypot(c.x - pt.x, c.z - pt.z) < K.R) { c.f -= K.HIT * dt; if (c.f < K.OUT) c.f = 0; }
      }
      // the ladder turned toward the water, a little up
      const tk = r.truck; if (pt) { tk.yaw += (tk.yawTo(pt.x, pt.z) - tk.yaw) * Math.min(1, dt * 3); tk.lift += (0.18 - tk.lift) * Math.min(1, dt); }
      if (r.jet) r.jet.set(noz, pt, spray);
      if (out === K.N && !r.end) { r.stage = 'done'; A.on(false); r.win(); }
      if (r.stage === 'drive' && !A.shown && s > r.s1 - 250) A.on(true);   // (the pad and GASI: once the fire is in sight)
      const inFire = s > r.s1 - 40 && s < r.s1 + K.LEN + 40;
      r.say(r.filling ? 'Polnjenje vode.' : r.water <= 0 ? (s > r.sP ? 'Vode ni več: vrni se do jezerca na kmetiji.' : 'Vode ni več: pelji do jezerca na kmetiji.')
        : (A.spray || r.autoSpray) && v >= K.VMAX ? 'Prehitro za gašenje: upočasni pod 30 km/h.' : (A.spray || r.autoSpray) && !reach ? 'Predaleč: curek ne seže do tja.'
        : inFire || s > r.s1 ? this.hint : tr('Do ognja: {0} km', dec((Math.max(0, r.s1 - s) / 1000).toFixed(1))));
      r.near = near;
      for (const q of r.roos) { q.s += 3.2 * dt; const p = KIT.at(T, q.s, q.o), h = Math.abs(Math.sin((r.t + q.ph) * 4.2)) * 0.9; q.m.position.set(p.x, p.y + h, p.z); q.m.rotation.y = p.ry; if (q.s > r.sP + 300) q.s -= 360; }   // (the kangaroos hop along the paddock, away from the fire)
      this.flames(r); r.fire.step(dt); if (r.jet) r.jet.step(dt); tk.step(dt, true);
      this.show(r);
    },
    // driven to the top (past the fire): not done
    finish(r) { r.fail(tr('Zapeljal si mimo ognja.')); },
    show(r) {
      r.set('voda', Math.round(r.water) + ' l', r.water / K.WATER);
      const n = r.near != null && r.near < 1e8 ? r.near : Math.min(...r.cells.map(c => c.d));
      const dh = Math.max(0, Math.round(n + 2 * 6 + K.HOFF));
      r.set('hisa', dh + ' m', null, dh < 70 ? '#e8452c' : null);
      r.set('veter', K.WIND + ' km/h');
      const out = r.cells.filter(c => c.f <= 0).length / K.N;
      r.set('pog', Math.round(out * 100) + ' %', out);
    },
  });
})();
