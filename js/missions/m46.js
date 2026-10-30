/* Special mission 46 · Požar v predoru · Uncompahgre, ZDA (js/missions.js; the kit: js/missions/kit.js). A lorry burns deep in a tunnel
   on the mountain road (the mission's own: K.LEN m of walls and a roof over the road from K.AT, its portals); the smoke is so thick the
   crew sees only a few metres (an overlay round the truck, its radius the visibility: K.VIS m in the full fire, K.VIS1 with it out), only
   the hazard lamps of the trapped cars, the green exit signs on the walls and the fire's glow shine through it (dots over the overlay). The fire engine
   (MisKit.fireTruck) goes in on its breathing sets (K.AIR s of air while in the smoke): stopped beside each trapped car (within K.CAR m,
   K.LOAD s) its people are taken on board; stopped before the lorry (K.ZONE m), the crew puts out its fire as in mission 01 (the finger,
   GASI); then out of the far portal: done, if everyone is aboard. The air gone in the smoke, the lorry passed while burning, out of the
   tunnel with people left behind, the time up: failed. The tunnel's roof is not drawn while the truck is inside (the camera is above). */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js');
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s), dec = (s) => (typeof Lang !== 'undefined' ? Lang.dec(s) : String(s));
  const K = { AT: 2000, LEN: 300, H: 6, CARS: [[60, 1, 2], [110, -1, 1], [150, 1, 1], [195, -1, 1]], LORRY: 245, ZONE: [-24, -10], VSTOP: 2.5, VHELP: 7, CAR: 9, LOAD: 2.5,
    AIR: 200, VIS: 6, VIS1: 30, WATER: 1500, FLOW: 25, HIT: 0.45, R: 3.6, BACK: 0.01, OUT: 0.03, SPOTS: 5 };

  // the tunnel: two walls and the roof along the road (10 m pieces), the portals' frames; the walls one mesh, the roof another (hidden inside)
  function tunnel(r, T, s0) {
    const Wl = KIT.parts(), Rf = KIT.parts(), CON = 0xa7a39a, DRK = 0x55524c;
    // a box along the road at s, off its centre line by off, dy over the road
    const put = (B, s, off, dy, lx, ly, lz, c) => { const p = KIT.at(T, s, off); B.box(p.x, p.ty + dy, p.z, lx, ly, lz, c, p.ry); };
    for (let s = s0; s < s0 + K.LEN; s += 10) { const m = s + 5, w = T.wS(m) + 0.9; put(Wl, m, -w, K.H / 2 - 0.5, 10.3, K.H + 1, 0.8, CON); put(Wl, m, w, K.H / 2 - 0.5, 10.3, K.H + 1, 0.8, CON); put(Rf, m, 0, K.H + 0.2, 10.3, 0.8, 2 * w + 0.8, DRK); }
    for (const s of [s0, s0 + K.LEN]) { const w = T.wS(s) + 2.5; put(Wl, s, -w, K.H / 2, 1.6, K.H + 2, 3.2, 0xc9c4b8); put(Wl, s, w, K.H / 2, 1.6, K.H + 2, 3.2, 0xc9c4b8); put(Wl, s, 0, K.H + 1.2, 1.6, 1.6, 2 * w + 3.2, 0xc9c4b8); }
    const lam = new THREE.MeshLambertMaterial({ vertexColors: true }), walls = Wl.mesh(lam), roof = Rf.mesh(lam);
    walls.castShadow = roof.castShadow = true; r.add(walls); r.add(roof);
    return { walls, roof };
  }
  // a trapped car (a body, its cabin) or the lorry (its cab, its box): one mesh each
  function car(r, p, lorry) {
    const B = KIT.parts(), c = lorry ? 0xd8d4c8 : [0x3d6fb8, 0xb8b2a6, 0x6e2a2a, 0x2f4a36][r.carN++ % 4];
    if (lorry) { B.box(3.2, 1.5, 0, 2.2, 2.4, 2.5, 0x2d5d9a); B.box(-1.6, 1.9, 0, 7.4, 3.0, 2.5, c); B.box(0, 0.5, 0, 9.6, 0.5, 2.2, 0x222428); }
    else { B.box(0, 0.75, 0, 4.4, 0.8, 1.8, c); B.box(-0.3, 1.4, 0, 2.3, 0.6, 1.6, 0x26303a); }
    const m = B.mesh(new THREE.MeshLambertMaterial({ vertexColors: true })); m.position.set(p.x, p.ty, p.z); m.rotation.y = p.ry; r.add(m); return m;
  }
  // the overlay of the smoke (a hole round the truck as big as the visibility) and the dots that shine through it
  function smoke(r) {
    const S = { set() {} };
    if (typeof document === 'undefined') return S;
    const hud = document.getElementById('hud'), at = hud && hud.parentNode ? (e) => hud.parentNode.insertBefore(e, hud) : (e) => document.body.appendChild(e);   // (under the HUD: its panel and buttons over the smoke)
    const el = document.createElement('div'); el.id = 'mis-smoke'; at(el);
    const dots = document.createElement('div'); dots.id = 'mis-dots'; at(dots);
    const v = new THREE.Vector3(), q = new THREE.Vector3();
    S.set = (k, P, vis, pts) => {
      el.style.opacity = k.toFixed(3); dots.style.opacity = Math.min(1, k * 1.5).toFixed(3);
      if (k <= 0.01) { if (dots.innerHTML) dots.innerHTML = ''; return; }
      const C = Render.camera; v.set(P.x, (P.y || 0) + 1, P.z).project(C); q.set(P.x + Math.cos(P.h) * vis, (P.y || 0) + 1, P.z + Math.sin(P.h) * vis).project(C);
      const W = innerWidth, H = innerHeight, x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * H, rad = Math.max(30, Math.hypot(((q.x + 1) / 2 * W) - x, ((1 - q.y) / 2 * H) - y));
      el.style.background = 'radial-gradient(circle at ' + x.toFixed(0) + 'px ' + y.toFixed(0) + 'px, rgba(46,44,42,0) ' + (rad * 0.55).toFixed(0) + 'px, rgba(46,44,42,.93) ' + (rad * 1.25).toFixed(0) + 'px, rgba(34,33,32,.985) ' + (rad * 2.4).toFixed(0) + 'px)';
      const on = (r.t * 1.8) % 1 < 0.55;
      dots.innerHTML = pts.map(p => { v.set(p.x, p.y, p.z).project(C); if (v.z > 1 || Math.abs(v.x) > 1.1 || Math.abs(v.y) > 1.1) return ''; return '<i class="' + p.k + (p.k === 'haz' && !on ? ' off' : '') + '" style="left:' + ((v.x + 1) / 2 * 100).toFixed(1) + '%;top:' + ((1 - v.y) / 2 * 100).toFixed(1) + '%"></i>'; }).join('');
    };
    r.add(new THREE.Group()); r.props[r.props.length - 1].userData.misUndo = () => { el.remove(); dots.remove(); };
    return S;
  }

  Missions.add({
    id: '46', title: 'Požar v predoru', track: 'uncompahgre', limit: 330, stars: [190, 250], K,
    story: 'V predoru na gorski cesti gori tovornjak. Dim je tako gost, da se vidijo le utripalke ujetih avtov.',
    goal: 'Reši ujete iz zadimljenega predora in pogasi ogenj.',
    hint: 'V dimu sledi utripalkam ujetih avtov, ljudi naloži, nato pogasi ogenj.',
    rows: [{ k: 'vis', label: 'VIDLJIVOST V DIMU', bar: true, col: '#e8452c' }, { k: 'air', label: 'ZRAK V JEKLENKAH', bar: true, col: '#3d8cff' }, { k: 'res', label: 'REŠENI' }, { k: 'ogenj', label: 'DO OGNJA' }],
    // alone on the closed road, by day; the fire engine (the racing truck's physics, slower)
    opts: () => ({ tt: true, playerModel: KIT.truckModel('titan', { vLim: 105, kw: 560, len: 8.4 }), playerColor: 0xc4161c, damage: 0 }),
    begin(r) {
      const T = r.race.track, s0 = T.startS + K.AT;
      r.s0 = s0; r.s1 = s0 + K.LEN; r.sL = s0 + K.LORRY; r.stage = 'drive'; r.air = K.AIR; r.water = K.WATER; r.carN = 0; r.f = 1; r.fl = new Array(K.SPOTS).fill(1);
      r.cars = K.CARS.map(([d, side, n]) => ({ s: s0 + d, side, n, t: 0 })); r.total = r.cars.reduce((a, c) => a + c.n, 0); r.aboard = 0;
      if (typeof THREE !== 'undefined') {
        r.tun = tunnel(r, T, s0);
        for (const c of r.cars) { const p = KIT.at(T, c.s, c.side * T.wS(c.s) * 0.5); c.x = p.x; c.z = p.z; c.y = p.ty; c.m = car(r, p); }
      }
      // the lorry on the right-hand lane, its fire: the cab and the box
      const pl = KIT.at(T, r.sL, T.wS(r.sL) * 0.5); r.lorry = { x: pl.x, y: pl.ty, z: pl.z };
      if (typeof THREE !== 'undefined') car(r, pl, true);
      const fx = Math.cos(pl.ry), fz = -Math.sin(pl.ry);   // (along the road)
      r.flP = [-4, -1.5, 1, 3.4, -2.8].map((a, k) => [pl.x + fx * a, pl.ty + (k === 3 ? 2.6 : 3.4), pl.z + fz * a]);
      r.truck = KIT.fireTruck(r); r.fire = KIT.fire(r, K.SPOTS); r.jet = KIT.jet(r); r.smoke = smoke(r);
      r.aim = KIT.aim(r, { plane: 'v', focus: typeof THREE !== 'undefined' ? new THREE.Vector3(pl.x, pl.ty + 2.5, pl.z) : null });
      // the dots in the smoke: the cars' hazard lamps, the exit signs every 25 m on the walls (green, low)
      r.dots = [];
      for (const c of r.cars) r.dots.push({ x: c.x, y: c.y + 0.9, z: c.z, k: 'haz', c });
      for (let s = s0 + 12; s < r.s1; s += 25) for (const sd of [-1, 1]) { const p = KIT.at(T, s, sd * (T.wS(s) + 0.4)); r.dots.push({ x: p.x, y: p.ty + 1.2, z: p.z, k: 'exit' }); }
      this.flames(r); this.show(r);
    },
    flames(r) { r.flP.forEach((p, k) => r.fire.spot(k, p[0], p[1], p[2], r.fl[k] > K.OUT ? 2.4 + 3.6 * r.fl[k] : 0)); },
    step(r, dt) {
      const P = r.P, T = r.race.track, s = P.q ? P.q.s : 0, v = Math.hypot(P.vx || 0, P.vz || 0);
      const inside = s > r.s0 - 2 && s < r.s1 + 2, smoky = inside && r.f > 0;
      // the air: used in the smoke
      if (smoky) { r.air = Math.max(0, r.air - dt); if (r.air <= 0) r.fail(tr('Zmanjkalo je zraka v jeklenkah.')); }
      // the trapped cars: stopped beside one, its people aboard
      for (const c of r.cars) if (c.n > 0) {
        const near = Math.abs(s - c.s) < K.CAR && v < 1.5;
        c.t = near ? c.t + dt : 0;
        if (c.t >= K.LOAD) { r.aboard += c.n; c.n = 0; c.done = true; }
      }
      const dl = s - r.sL;
      if (r.stage === 'drive') {
        const inZ = dl >= K.ZONE[0] && dl <= K.ZONE[1] && r.f > 0;
        if (inZ && v < K.VHELP) { const k = Math.exp(-dt * 2.5); P.vx *= k; P.vz *= k; }
        if (inZ && v < K.VSTOP) { r.stage = 'fight'; r.aim.on(true); if (r.aim.toFocus) r.aim.toFocus(); }
        if (r.f > 0 && dl > -6) r.fail(tr('Zapeljal si v ogenj.'));
        if (s > r.s1 + 8) { if (r.aboard < r.total) r.fail(tr('V predoru so ostali ljudje.')); else if (r.f <= 0) { r.stage = 'done'; r.win(); } }
        const loading = r.cars.find(c => c.n > 0 && c.t > 0);
        r.say(loading ? 'Nalaganje ljudi.' : s < r.s0 - 30 ? tr('Do predora: {0} km', dec((Math.max(0, r.s0 - s) / 1000).toFixed(1))) : r.f > 0 && r.aboard < r.total ? this.hint
          : r.f > 0 ? 'Ustavi pred gorečim tovornjakom in ga pogasi.' : 'Ogenj je pogašen: pelji ven iz predora.');
      } else if (r.stage === 'fight') {
        KIT.hold(P);
        const tk = r.truck; tk.lift += (0.12 - tk.lift) * Math.min(1, dt * 1.5); tk.yaw += (tk.yawTo(r.lorry.x, r.lorry.z) - tk.yaw) * Math.min(1, dt * 2);
        r.aim.step();
        const spray = (r.aim.spray || r.autoSpray) && r.water > 0, pt = r.autoSpray || r.aim.point;
        if (spray) r.water = Math.max(0, r.water - K.FLOW * dt);
        let sum = 0;
        r.flP.forEach((p, k) => { if (r.fl[k] <= 0) return; const hit = spray && pt && Math.hypot(p[0] - pt.x, p[1] - pt.y, p[2] - pt.z) < K.R; r.fl[k] = hit ? r.fl[k] - K.HIT * dt : Math.min(1, r.fl[k] + K.BACK * dt); if (r.fl[k] < K.OUT) r.fl[k] = 0; sum += r.fl[k]; });
        r.f = sum / K.SPOTS;
        if (r.jet) r.jet.set(r.truck.nozzle(), pt, spray);
        r.say(r.water <= 0 ? 'Voda je pošla.' : 'Povleci s prstom, da usmeriš curek na ogenj, in drži GASI.');
        if (r.f <= 0) { r.stage = 'drive'; r.aim.on(false); if (r.jet) r.jet.set(null, null, false); KIT.hold(P, false); r.truck.lift = 0; }
        else if (r.water <= 0) r.fail(tr('Zmanjkalo je vode.'));
      }
      // the roof out of sight with the truck inside; the smoke's overlay
      if (r.tun) r.tun.roof.visible = !inside;
      const vis = K.VIS + (K.VIS1 - K.VIS) * (1 - r.f), near = Math.max(0, Math.min(1, (s - (r.s0 - 30)) / 30)) * Math.max(0, Math.min(1, (r.s1 + 20 - s) / 20));
      r.vis = vis;
      if (typeof THREE !== 'undefined') r.smoke.set(near * (0.35 + 0.65 * r.f), P, vis, r.dots.filter(d => d.k !== 'haz' || !d.c.done).concat(r.flP.filter((p, k) => r.fl[k] > 0).map(p => ({ x: p[0], y: p[1], z: p[2], k: 'fire' }))));
      this.flames(r); r.fire.step(dt); if (r.jet) r.jet.step(dt); r.truck.step(dt, true);
      this.show(r);
    },
    // driven over the finish (out of the tunnel, past where the mission ends): the end decides there already, else not done
    finish(r) { r.fail(tr('Zapeljal si predaleč.')); },
    show(r) {
      const vis = r.vis || K.VIS;
      r.set('vis', Math.round(vis) + ' m', vis / K.VIS1);
      r.set('air', tr('še {0} min', dec((r.air / 60).toFixed(1))), r.air / K.AIR, r.air < 60 ? '#e8452c' : null);
      r.set('res', r.aboard + ' / ' + r.total);
      const P = r.P, s = P && P.q ? P.q.s : 0;
      r.set('ogenj', r.f <= 0 ? tr('pogašen') : Math.max(0, Math.round(r.sL - s)) + ' m');
    },
  });
})();
