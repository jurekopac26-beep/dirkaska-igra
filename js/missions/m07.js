/* Special mission 07 · Cisterna · Sani Pass, Južna Afrika (js/missions.js; the kit: js/missions/kit.js). A full tanker of fuel up the gravel
   hairpins (MisKit.skin over the racing truck's physics, 10 m, its own limiter K.VMAX), from K.S0 m past the start line to the top (the
   finish line). The fuel sloshes: a pendulum in the tank (slosh, -1..1: the fuel's lean, > 0 to the right) driven by the sideways pull
   (the speed squared over the road's bend: K.AS m/s2 tips it fully over, its swing K.T s, its damping K.DAMP) that pushes the truck out of the bends
   (K.PUSH m/s2 at full slosh) and keeps swinging after them. NAGIB: how far over the tanker leans (the pull over K.AR plus the slosh x
   K.KS); at 1 for K.ROLL s it rolls over: failed. PLJUSKANJE: the slosh. DO VRHA: what is left. */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js');
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s);
  const dec = (s) => (typeof Lang !== 'undefined' && Lang.dec ? Lang.dec(s) : String(s).replace('.', ','));
  const K = { S0: 2200, VMAX: 50, AS: 5.0, T: 1.9, DAMP: 1.8, PUSH: 1.1, AR: 8.0, KS: 0.38, ROLL: 0.3, WARN: 0.7 };
  const CAB = 0xe2c12b, TANK = 0xd5dade, GLS = 0x1d2733, BLK = 0x1b1d21, GRY = 0x9aa1a8, RED = 0xc4161c;

  // the tanker: the cab in front, the tank along it (a cylinder lying along x), its walkway on top, the hazard plates, three axles
  function tanker(B) {
    B.box(3.9, 1.85, 0, 2.2, 2.4, 2.45, CAB); B.box(5.01, 2.25, 0, 0.04, 0.9, 2.2, GLS); B.box(3.6, 3.15, 0, 1.4, 0.2, 2.3, 0xc9aa1e);
    B.box(-0.8, 0.85, 0, 8.6, 0.3, 1.2, BLK);
    const M = new THREE.Matrix4(); M.makeRotationZ(Math.PI / 2); M.setPosition(-1.0, 2.1, 0); B.L.push({ g: new THREE.CylinderGeometry(1.2, 1.2, 7.4, 16), m: M, c: TANK });
    for (const x of [2.7, -4.7]) { const E = new THREE.Matrix4(); E.makeRotationZ(Math.PI / 2); E.setPosition(x, 2.1, 0); B.L.push({ g: new THREE.CylinderGeometry(1.1, 1.1, 0.08, 16), m: E, c: GRY }); }
    B.box(-1.0, 3.36, 0, 6.8, 0.06, 0.6, GRY); for (const x of [-3.2, -1.0, 1.2]) B.box(x, 3.42, 0, 0.5, 0.12, 0.5, GRY);
    B.box(-4.76, 2.1, 0, 0.04, 0.5, 0.6, 0xff7a1a); B.box(5.03, 1.2, 0, 0.04, 0.3, 0.5, 0xff7a1a);
    for (const sd of [-1, 1]) B.box(-1.0, 1.1, sd * 1.1, 7.0, 0.12, 0.05, RED);
    for (const x of [3.6, -2.9, -4.1]) for (const sd of [-1, 1]) B.cyl(x, 0.52, sd * 1.05, 0.52, 0.4, BLK);
    B.box(5.03, 1.0, 0.9, 0.04, 0.22, 0.4, 0xfff4cc); B.box(5.03, 1.0, -0.9, 0.04, 0.22, 0.4, 0xfff4cc);
    B.box(-4.9, 1.0, 1.0, 0.04, 0.25, 0.25, 0xff3a2a); B.box(-4.9, 1.0, -1.0, 0.04, 0.25, 0.25, 0xff3a2a);
  }

  Missions.add({
    id: '07', title: 'Cisterna', track: 'sani', limit: 600, stars: [330, 420], K,
    story: 'Polna cisterna goriva mora čez strme makadamske serpentine. Gorivo v njej pljuska.',
    goal: 'Pripelji cisterno na vrh, ne da se prevrne. Pljuskanje te potiska iz ovinkov.',
    hint: 'Počasi skozi ovinke, da gorivo ne zaniha cisterne.',
    rows: [{ k: 'nagib', label: 'NAGIB', bar: true }, { k: 'pljusk', label: 'PLJUSKANJE', bar: true, col: '#3fa8e0' }, { k: 'vrh', label: 'DO VRHA' }],
    // alone up the pass by day; the tanker: the racing truck's physics, 10 m, slow and heavy
    opts: () => ({ tt: true, playerModel: KIT.truckModel('truck', { vLim: K.VMAX, len: 10.0, wid: 2.5, mass: 9000, kw: 520 }), playerColor: CAB, damage: 0 }),
    made(race) {
      const T = race.track, c = race.player; if (!c) return;
      const s = T.startS + K.S0, i = T.idx(s);
      c.place(T.px[i], T.pz[i], T.hd[i]); if (T.hasElev) { c.y = c.py = T.hy[i]; c.roadY = c.y; }
      c.dist = s - T.startS; c.q = T.query(T.px[i], T.pz[i], i, {}); c.sPrev = c.q.s;
      while (c.cp < T.cpS.length && c.dist >= T.cpDist[c.cp]) { c.splits.push(0); c.cp++; }
    },
    begin(r) {
      r.slosh = 0; r.sv = 0; r.tilt = 0; r.over = 0; r.lat = 0;
      if (typeof THREE !== 'undefined' && typeof document !== 'undefined') {
        r.skin = KIT.skin(r, r.P, tanker);
        if (r.skin) { const v = Render.viewOf(r.P); if (v && v.lights && v.lights.length >= 4) { v.lights[0].set(5.05, 1.0, -0.9); v.lights[1].set(5.05, 1.0, 0.9); v.lights[2].set(-4.92, 1.0, -1.0); v.lights[3].set(-4.92, 1.0, 1.0); } }
      }
      this.show(r);
    },
    // the road's bend at s (1 / its radius, > 0 to the right): the speed through it is what pulls (not the twitch of the steering)
    bend(T, s) { const i = T.idx(s - 6), j = T.idx(s + 6); let a = Math.atan2(T.tz[j], T.tx[j]) - Math.atan2(T.tz[i], T.tx[i]); a = Math.atan2(Math.sin(a), Math.cos(a)); return a / 12; },
    step(r, dt) {
      const P = r.P, T = r.race.track, q = P.q; if (!q) return;
      // the sideways pull (to the right > 0) and the fuel's pendulum after it
      const v = Math.hypot(P.vx || 0, P.vz || 0), lat = v * v * this.bend(T, q.s);
      r.lat += (lat - r.lat) * Math.min(1, dt * 8);
      const om = 2 * Math.PI / K.T, eq = Math.max(-1.3, Math.min(1.3, -r.lat / K.AS));
      r.sv += (-om * om * (r.slosh - eq) - K.DAMP * r.sv) * dt; r.slosh += r.sv * dt;
      if (Math.abs(r.slosh) > 1.4) { r.slosh = Math.sign(r.slosh) * 1.4; r.sv = 0; }
      // the fuel pushes the truck its way (out of the bend), the tanker leans
      const nx = -Math.sin(P.h), nz = Math.cos(P.h), push = r.slosh * K.PUSH * Math.min(1, v / 3) * dt;
      P.vx += nx * push; P.vz += nz * push;
      r.tilt = -r.lat / K.AR + r.slosh * K.KS;
      const a = Math.abs(r.tilt);
      r.over = a >= 1 ? r.over + dt : Math.max(0, r.over - dt * 2);
      if (r.skin) r.skin.rotation.x = Math.max(-0.2, Math.min(0.2, r.tilt * 0.12));
      if (r.over >= K.ROLL) {
        if (r.skin) { const sd = Math.sign(r.tilt) || 1; r.skin.rotation.x = sd * 1.4; r.skin.position.set(0, 1.0, sd * 1.4); }
        r.fail(tr('Cisterna se je prevrnila.')); this.show(r); return;
      }
      r.say(a > K.WARN ? 'Cisterna se nagiba: počasneje!' : Math.abs(r.slosh) > 0.6 && Math.abs(r.lat) < 1 ? 'Gorivo še pljuska: počakaj, da se umiri.' : this.hint);
      this.show(r);
    },
    show(r) {
      const T = r.race.track, P = r.P, left = Math.max(0, (T.startS + (T.raceLen || T.len)) - ((P.q && P.q.s) || 0)), a = Math.min(1, Math.abs(r.tilt));
      r.set('nagib', Math.round(a * 100) + ' %', a, a < 0.5 ? '#3fbf6a' : a < K.WARN ? '#ffb020' : '#e8452c');
      const sl = Math.min(1, Math.abs(r.slosh));
      r.set('pljusk', Math.round(sl * 100) + ' %', sl, sl < 0.5 ? '#3fa8e0' : '#ffb020');
      r.set('vrh', dec((left / 1000).toFixed(1)) + ' km');
    },
  });
})();
