/* Special mission 02 · Zlata ura · Newcastle, Avstralija (js/missions.js; the kit: js/missions/kit.js, MisKit.ride, skin, crowd, tags,
   button, hospital). An accident on the coast road past the old fort (K.SA m round the lap, on the road's roomier side: a car turned
   across the road's edge (a box in the way, MisKit.block), a warning triangle, the injured lying beside it, a helper kneeling). The ambulance (a van of
   simple bodies, MisKit.skin over the van's physics with its own limiter and softer brakes, its blue lamps flashing) drives there from the
   harbour front, stops by the scene (within K.ZONE m of it, slower than K.VSTOP m/s): NALOŽI, the crew loads the patient (K.LOAD s, the van
   held). Then to the hospital at the finish on the harbour front (MisKit.hospital). The patient's pulse (UTRIP, its trace drawn in the
   panel): from K.HR0 a minute, up with every jolt (MisKit.ride: braking hard, a bend too fast, a knock; HR = K.HRMIN + K.HRK x (1 - the
   calm) + the worsening K.WORSE a second since loaded), down slowly when driven smoothly; at K.HRMAX: failed. The golden hour: the limit. */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js');
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s), dec = (s) => (typeof Lang !== 'undefined' ? Lang.dec(s) : String(s));
  const K = { SA: 1650, ZONE: 14, VSTOP: 1.0, LOAD: 5, VMAX: 110, BRK: 0.4, BRKA: 5.0, LAT: 4.5, DROP: 0.18, KICK: 0.06, KNOCK: 0.35, REC: 0.012,
    HR0: 138, HRMIN: 112, HRK: 68, HRMAX: 180, WORSE: 0.05 };
  const WH = 0xf4f5f7, RED = 0xd8282a, GLS = 0x1d2733, BLK = 0x1b1d21, YEL = 0xe8d02a;

  // the ambulance: a high van, white, a red band and a yellow one under it, the lamps' bar on the roof (its lamps blinking, step)
  function van(B) {
    B.box(0.2, 1.45, 0, 5.0, 2.1, 2.0, WH); B.box(2.1, 0.95, 0, 1.2, 1.1, 1.96, WH);
    B.box(0.2, 1.15, 0, 5.02, 0.22, 2.02, RED); B.box(0.2, 0.92, 0, 5.02, 0.16, 2.02, YEL);
    B.box(2.45, 1.75, 0, 0.6, 0.7, 1.9, GLS); for (const sd of [-1, 1]) B.box(1.95, 1.85, sd * 1.0, 0.8, 0.55, 0.02, GLS);
    B.box(-2.31, 1.8, 0, 0.04, 0.6, 1.4, GLS); B.box(-2.32, 1.45, 0, 0.03, 2.0, 0.04, 0x9aa1a8);
    B.box(0.2, 2.52, 0, 4.8, 0.05, 1.9, 0xe2e5e8);
    B.box(2.71, 0.95, 0.7, 0.04, 0.18, 0.3, 0xfff4cc); B.box(2.71, 0.95, -0.7, 0.04, 0.18, 0.3, 0xfff4cc);
    B.box(-2.32, 1.0, 0.85, 0.04, 0.3, 0.2, 0xff3a2a); B.box(-2.32, 1.0, -0.85, 0.04, 0.3, 0.2, 0xff3a2a);
    for (const x of [1.75, -1.6]) for (const sd of [-1, 1]) B.cyl(x, 0.4, sd * 0.88, 0.4, 0.28, BLK);
  }
  // the scene: the car turned across (crumpled at the front), the warning triangle 20 m before it, the injured lying beside it
  function scene(B, c) {
    const co = Math.cos(c.ry), sn = Math.sin(c.ry), at = (u, v) => [c.x + u * co + v * sn, c.z - u * sn + v * co];
    const box = (u, y, v, lx, ly, lz, col, rot) => { const [x, z] = at(u, v); B.box(x, c.y + y, z, lx, ly, lz, col, c.ry + (rot || 0)); };
    const tw = 0.75;   // (the car's own turn across the road)
    const cu = (u, v) => [u * Math.cos(tw) + v * Math.sin(tw), -u * Math.sin(tw) + v * Math.cos(tw)];
    const car = (u, y, v, lx, ly, lz, col) => { const [a, b] = cu(u, v); box(a, y, b + 1.6, lx, ly, lz, col, tw); };
    car(0, 0.7, 0, 4.2, 0.75, 1.8, 0x2f5fb8); car(-0.3, 1.32, 0, 2.2, 0.55, 1.66, GLS); car(1.95, 0.7, 0, 0.5, 0.6, 1.7, 0x23447f);
    for (const [u, v] of [[1.3, 0.8], [1.3, -0.8], [-1.3, 0.8], [-1.3, -0.8]]) { const [a, b] = cu(u, v); const [x, z] = at(a, b + 1.6); B.cyl(x, c.y + 0.33, z, 0.33, 0.24, BLK); }
    box(-20, 0.3, -1.2, 0.08, 0.55, 0.6, 0xe0301a);   // (the warning triangle, edge on)
    box(2.5, 0.16, -1.2, 1.7, 0.28, 0.5, 0x4a6fa0); box(3.45, 0.18, -1.2, 0.28, 0.28, 0.28, 0xd9a77e);   // (the injured, lying)
  }

  Missions.add({
    id: '02', title: 'Zlata ura', track: 'newcastle', limit: 240, stars: [165, 200], K,
    story: 'Na obalni cesti se je zgodila nesreča. Z reševalnim vozilom prideš do ponesrečenca in ga naložiš.',
    goal: 'Odpelji ponesrečenca v bolnišnico. Če si prepočasen ali sunkovit, ponesrečenec umre.',
    hint: 'Vozi mirno: vsak sunek in trk dvigne utrip.',
    rows: [{ k: 'hr', label: 'UTRIP', bar: true }, { k: 'stanje', label: 'STANJE' }, { k: 'cilj', label: 'CILJ' }],
    // alone on the closed streets, one lap, dry, by day; the van, its own limiter, softer brakes, no damage
    opts: () => ({ tt: true, laps: 1, playerModel: KIT.truckModel('superkombi', { vLim: K.VMAX, brakeK: K.BRK }), playerColor: WH, damage: 0 }),
    begin(r) {
      const T = r.race.track, sA = T.startS + K.SA, i = T.idx(sA), side = T.br[i] >= T.bl[i] ? 1 : -1, w = T.wS(sA);
      r.st = 'go'; r.load = 0; r.hr = null; r.tLoad = 0; r.sA = sA;
      r.ride = KIT.ride({ brk: K.BRKA, lat: K.LAT, drop: K.DROP, kick: K.KICK, knock: K.KNOCK, rec: K.REC });
      r.site = { x: T.px[i] + T.nx[i] * side * (w - 3.2), z: T.pz[i] + T.nz[i] * side * (w - 3.2), y: T.hy[i], i, side };
      { const cd = side * (w - 1.6); r.wk = { x: T.px[i] + T.nx[i] * cd, z: T.pz[i] + T.nz[i] * cd, h: Math.atan2(T.tz[i], T.tx[i]) - side * 0.75, L: 4.3, W: 1.9 }; }   // (the car turned across the road's edge: a box in the way)
      if (typeof Render !== 'undefined' && Render.setAtmos) Render.setAtmos({ season: 'summer', tod: 'day' }, true);
      if (typeof THREE !== 'undefined' && typeof document !== 'undefined') {
        r.skin = KIT.skin(r, r.P, van);
        if (r.skin) {
          const v = Render.viewOf(r.P); if (v && v.lights && v.lights.length >= 4) { v.lights[0].set(2.73, 0.95, -0.7); v.lights[1].set(2.73, 0.95, 0.7); v.lights[2].set(-2.34, 1.0, -0.85); v.lights[3].set(-2.34, 1.0, 0.85); }
          const on = new THREE.MeshBasicMaterial({ color: 0x5aa0ff }), off = new THREE.MeshLambertMaterial({ color: 0x10204a });
          const L = [0.45, -0.45].map(z => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.6), on); m.position.set(1.9, 2.62, z); r.skin.add(m); return m; });
          r.lamps = (t) => { const a = (t * 2) % 1 < 0.5; L[0].material = a ? on : off; L[1].material = a ? off : on; };
        }
        const B = KIT.parts(), ry = Math.atan2(-T.tz[i], T.tx[i]) + (side < 0 ? Math.PI : 0);
        scene(B, { x: r.site.x, z: r.site.z, y: r.site.y, ry });
        r.wreck = B.mesh(new THREE.MeshLambertMaterial({ vertexColors: true })); r.wreck.castShadow = true; r.add(r.wreck);
        r.helper = KIT.crowd(r, 1); r.helper.put(0, r.site.x + T.tx[i] * 2.5, r.site.y - 0.28 - 0.5, r.site.z + T.tz[i] * 2.5, ry, 0xe2661c);
        r.hs = KIT.hospital(r, T, (T.finishS || 0) + 12);
        r.tags = KIT.tags(r);
      }
      r.btn = KIT.button(r, 'NALOŽI');
      this.show(r);
    },
    // the pulse a minute from the calm and the time since loaded
    pulse(r) { return K.HRMIN + K.HRK * (1 - r.ride.calm) + K.WORSE * (r.t - r.tLoad); },
    step(r, dt) {
      const P = r.P, T = r.race.track, v = Math.hypot(P.vx || 0, P.vz || 0), S = r.site;
      const dS = Math.hypot(P.x - S.x, P.z - S.z);
      KIT.block(P, r.wk);
      if (r.st === 'go' && dS < 80) P.stuckT = 0;   // (stopping at the accident is no getting stuck: no Na progo)
      if (r.st === 'go') {
        const at = dS < K.ZONE && v < K.VSTOP;
        r.btn.show(dS < K.ZONE && v < K.VSTOP + 1.5);
        if (at && (r.btn.take() || r.autoLoad)) { r.st = 'load'; r.load = 0; r.btn.show(false); }
        r.say(dS < 80 ? (at ? 'Naloži ponesrečenca.' : 'Ustavi ob kraju nesreče.') : 'Pelji do kraja nesreče ob obalni cesti.');
      } else if (r.st === 'load') {
        KIT.hold(P); P.stuckT = 0; r.load += dt;
        r.say('Posadka nalaga ponesrečenca …');
        if (r.load >= K.LOAD) {
          r.st = 'carry'; KIT.hold(P, false); r.tLoad = r.t;
          r.ride.calm = 1 - (K.HR0 - K.HRMIN) / K.HRK; r.ride.vf = null;   // (the pulse at K.HR0)
          if (r.wreck && r.helper) { r.helper.hide(0); }
        }
      } else {
        r.ride.step(P, dt);
        r.hr = this.pulse(r);
        if (r.hr >= K.HRMAX) { r.hr = K.HRMAX; this.show(r); r.fail(tr('Ponesrečenec ni preživel.')); return; }
        const imp = Math.max(P.hitWall || 0, P.hitCar || 0);
        r.say(imp > 2 ? 'Trk! Utrip je poskočil.' : r.ride.lon < -K.BRKA ? 'Ne zaviraj tako ostro.' : r.ride.lat > K.LAT ? 'Prehitro v ovinek: utrip raste.' : r.hr > 160 ? 'Kritično! Vozi čisto mirno.' : this.hint);
      }
      if (r.lamps) r.lamps(r.t);
      if (r.hs) r.hs.blink(r.t);
      if (!r.ecg && typeof document !== 'undefined') {   // (the pulse's trace in its row: a small canvas, once the panel is there)
        const row = document.querySelector('#mis .mis-row[data-k="hr"]');
        if (row) { const c = document.createElement('canvas'); c.width = 132; c.height = 26; c.className = 'mis-ecg'; c.style.cssText = 'display:block;width:100%;height:22px;margin-top:2px'; row.appendChild(c); r.ecg = { c, g: c.getContext('2d'), buf: new Array(66).fill(0), ph: 0, acc: 0 }; }
      }
      if (r.ecg) this.ecg(r, dt);
      r.toGo = Math.max(0, (T.raceLen || T.len) - Math.max(0, P.dist));
      if (r.tags) { const L = []; if (r.st === 'go' && dS < 300) L.push({ x: S.x, y: S.y + 3.5, z: S.z, html: '<b>' + tr('NESREČA') + '</b>' + Math.round(dS) + ' m', cls: 'go' });
        if (r.st === 'carry' && r.hs && r.hs.g && r.toGo < 350) { const j = T.idx((T.finishS || 0) + 12); L.push({ x: T.px[j], y: T.hy[j] + 9, z: T.pz[j], html: '<b>' + tr('BOLNIŠNICA') + '</b>' + Math.round(r.toGo) + ' m', cls: 'go' }); }
        r.tags.set(L); }
      r.dA = Math.max(0, r.sA - (T.startS + Math.max(0, P.dist))); this.show(r);
    },
    // the trace: a beat at the pulse's pace, scrolled left
    ecg(r, dt) {
      const E = r.ecg, hz = (r.hr || 0) / 60; E.acc += dt;
      if (E.acc < 0.05) return; const st = E.acc; E.acc = 0;
      E.ph += st * (hz || 0);
      const p = E.ph % 1, y = !hz ? 0 : p < 0.06 ? 0.15 : p < 0.1 ? -0.35 : p < 0.14 ? 1 : p < 0.18 ? -0.5 : p < 0.32 ? 0 : p < 0.42 ? 0.22 : 0;
      E.buf.push(y); E.buf.shift();
      const g = E.g, W = E.c.width, H = E.c.height; g.clearRect(0, 0, W, H);
      g.strokeStyle = (r.hr || 0) > 160 ? '#ff5a3a' : (r.hr || 0) > 140 ? '#ffb020' : '#3fdf7a'; g.lineWidth = 2; g.beginPath();
      E.buf.forEach((v, k) => { const x = k * W / (E.buf.length - 1), yy = H * 0.62 - v * H * 0.5; if (k) g.lineTo(x, yy); else g.moveTo(x, yy); }); g.stroke();
    },
    finish(r) { if (r.st === 'carry') r.win(); else r.fail(tr('Ponesrečenca nisi naložil.')); },
    show(r) {
      const hr = r.hr;
      if (hr == null) { r.set('hr', '—', 0); r.set('stanje', r.st === 'load' ? tr('nalaganje') : tr('čaka pomoč')); }
      else { const f = (hr - K.HRMIN) / (K.HRMAX - K.HRMIN); r.set('hr', '♥ ' + Math.round(hr) + ' / min', 1 - f, f < 0.45 ? '#3fbf6a' : f < 0.7 ? '#ffb020' : '#e8452c'); r.set('stanje', hr < 135 ? tr('stabilno') : hr < 160 ? tr('resno') : tr('KRITIČNO')); }
      const T = r.race.track, km = (m) => m >= 1000 ? dec((m / 1000).toFixed(1)) + ' km' : Math.round(m) + ' m';
      if (r.st === 'carry') r.set('cilj', tr('bolnišnica') + ' ' + km(r.toGo != null ? r.toGo : T.len));
      else r.set('cilj', tr('nesreča') + ' ' + km(r.dA != null ? r.dA : K.SA));
    },
  });
})();
