/* Special mission 34 · Mestni avtobus · Toronto, Kanada (js/missions.js; the kit: js/missions/kit.js, MisKit.ride, skin, crowd, tags,
   button). The morning rush: a city bus (12 m, MisKit.skin over the racing truck's physics, its own limiter K.VMAX and soft brakes) on its
   line round the streets, already a little late (K.LATE s). At each of the K.STOPS stops (a shelter on the right, a yellow line along
   the kerb, people waiting) the bus stops with its front door by the line (the door within K.DOOR m of it along the road, the bus's
   right side within K.KERB m of the kerb, slower than K.VSTOP m/s): ODPRI VRATA, the bus held while the people walk in (K.BOARD s).
   A stop driven past (its door K.MISS m beyond the line): missed, K.PEN s added to the clock; more than K.MAXMISS missed: failed. UDOBJE (the standing passengers' comfort,
   MisKit.ride: braking hard (over K.BRKA m/s2: the full brake held at speed; taps of it are soft), a bend too fast, a knock) shown as
   five stars; at 0 the passengers fall: failed. ZAMUDA: the time against the timetable (K.VS m/s between the stops). The last stop
   served and the line crossed: done. */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js');
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s);
  const K = { STOPS: [520, 920, 1450, 1790, 2120, 2590], VMAX: 50, BRK: 0.22, BRKA: 3.0, LAT: 3.6, DROP: 0.2, KNOCK: 0.3, REC: 0.015,
    DOOR: 1.6, KERB: 1.3, VSTOP: 0.4, BOARD: 4, MISS: 8, PEN: 30, LATE: 20, VS: 8.5, MAXMISS: 2, DX: 4.85, PAX: 3, WID: 2.55 };
  const WH = 0xf1f3f5, BLU = 0x1f5fb0, GLS = 0x1d2733, BLK = 0x1b1d21, GRY = 0x9aa1a8, RED = 0xd8282a, YEL = 0xf2c21a;

  // the city bus: 12 m, white with a blue band low, the windows' band all along, the doors on the right (+z: x forward, y up), the roof's
  // air unit, the destination sign over the windscreen, its lights; two axles
  function bus(B) {
    B.box(0, 1.85, 0, 12.0, 2.8, 2.55, WH); B.box(0, 0.75, 0, 12.02, 0.5, 2.57, BLU);
    for (const sd of [-1, 1]) B.box(-0.4, 2.2, sd * 1.285, 10.4, 1.25, 0.02, GLS);
    B.box(6.01, 2.0, 0, 0.04, 1.9, 2.3, GLS); B.box(6.02, 3.0, 0, 0.04, 0.32, 1.6, 0x2a1d08); B.box(6.03, 3.0, 0, 0.02, 0.18, 1.3, 0xffb020);
    B.box(-6.01, 2.6, 0, 0.04, 0.9, 2.1, GLS);
    for (const x of [K.DX, 0.4]) B.box(x, 1.55, 1.29, 1.2, 2.3, 0.03, 0x2b3542);   // (the doors: front and middle)
    B.box(0, 3.27, 0, 11.8, 0.06, 2.45, 0xdfe3e7); B.box(-2.0, 3.48, 0, 3.4, 0.38, 1.8, GRY);
    B.box(6.02, 0.85, 0.95, 0.04, 0.2, 0.4, 0xfff4cc); B.box(6.02, 0.85, -0.95, 0.04, 0.2, 0.4, 0xfff4cc);
    B.box(-6.02, 1.0, 1.0, 0.04, 0.32, 0.22, 0xff3a2a); B.box(-6.02, 1.0, -1.0, 0.04, 0.32, 0.22, 0xff3a2a);
    for (const x of [3.9, -3.4]) for (const sd of [-1, 1]) B.cyl(x, 0.5, sd * 1.05, 0.5, 0.36, BLK);
  }
  // a stop: the shelter (its back and roof, the sign on a post) beside the kerb, the yellow line along the kerb (in the stop's frame: x
  // along the road, +z outward)
  function stopParts(B, x0, z0, y0, ry) {
    const c = Math.cos(ry), s = Math.sin(ry), P = (u, v) => [x0 + u * c + v * s, z0 - u * s + v * c];
    const put = (u, y, v, lx, ly, lz, col) => { const [x, z] = P(u, v); B.box(x, y0 + y, z, lx, ly, lz, col, ry); };
    put(0, 0.04, 0.12, 4.0, 0.03, 0.2, YEL);
    put(-1.0, 1.25, 1.5, 4.2, 2.3, 0.08, 0x8fb4c8); put(-1.0, 2.45, 1.05, 4.4, 0.12, 1.1, GRY);
    for (const u of [-3.1, 1.1]) put(u, 1.25, 1.05, 0.1, 2.5, 1.0, GRY);
    put(2.4, 1.4, 0.5, 0.1, 2.8, 0.1, GRY); put(2.4, 2.75, 0.5, 0.08, 0.6, 0.6, 0x1f5fb0);
  }

  Missions.add({
    id: '34', title: 'Mestni avtobus', track: 'toronto', limit: 600, stars: [380, 460], K,
    story: 'Jutranja konica. Na postajah čakajo potniki, avtobus pa že malo zamuja.',
    goal: 'Ustavi ob vsaki postaji tako, da so vrata ob rumeni črti. Vozi mehko, da potniki ne padejo.',
    hint: 'Ustavi tako, da so vrata ob rumeni črti, in zaviraj mehko.',
    rows: [{ k: 'post', label: 'POSTAJA' }, { k: 'zam', label: 'ZAMUDA' }, { k: 'udo', label: 'UDOBJE' }],
    // alone on the closed streets, one lap, dry, by day; the bus: the racing truck's physics, 12 m, slow, soft brakes, no damage
    opts: () => ({ tt: true, laps: 1, playerModel: KIT.truckModel('titan', { vLim: K.VMAX, kw: 330, len: 12.0, wid: K.WID, mass: 12000, brakeK: K.BRK }), playerColor: WH, damage: 0 }),
    begin(r) {
      const T = r.race.track;
      r.ride = KIT.ride({ brk: K.BRKA, lat: K.LAT, drop: K.DROP, knock: K.KNOCK, rec: K.REC });
      r.k = 0; r.st = 'drive'; r.board = 0; r.missed = 0; r.served = 0; r.delay = K.LATE;
      r.stops = K.STOPS.map((s, k) => { const i = T.idx(T.startS + s); return { s: T.startS + s, i, w: T.wS(T.startS + s), x: T.px[i], z: T.pz[i], sched: s / K.VS + k * K.BOARD * 2.2 - K.LATE }; });
      if (typeof Render !== 'undefined' && Render.setAtmos) Render.setAtmos({ season: 'summer', tod: 'day' }, true);
      if (typeof THREE !== 'undefined' && typeof document !== 'undefined') {
        r.skin = KIT.skin(r, r.P, bus);
        if (r.skin) { const v = Render.viewOf(r.P); if (v && v.lights && v.lights.length >= 4) { v.lights[0].set(6.04, 0.85, -0.95); v.lights[1].set(6.04, 0.85, 0.95); v.lights[2].set(-6.04, 1.0, -1.0); v.lights[3].set(-6.04, 1.0, 1.0); } }
        const B = KIT.parts(); r.crowd = KIT.crowd(r, K.STOPS.length * K.PAX);
        const COL = [0x3a6fd0, 0xc0392b, 0x2e8b57, 0x8e44ad, 0xd68910, 0x34495e];
        r.stops.forEach((p, k) => {
          const i = p.i, ry = Math.atan2(-T.tz[i], T.tx[i]), off = p.w + 0.05, x = T.px[i] + T.nx[i] * off, z = T.pz[i] + T.nz[i] * off, y = T.hy[i];
          stopParts(B, x, z, y, ry); p.ky = y; p.kx = x; p.kz = z;
          p.pax = []; for (let q = 0; q < K.PAX; q++) { const u = -2.4 + q * 1.2, v = 0.7 + (q % 2) * 0.35, px = x + T.tx[i] * u + T.nx[i] * v, pz = z + T.tz[i] * u + T.nz[i] * v; p.pax.push({ x: px, z: pz, on: true }); r.crowd.put(k * K.PAX + q, px, y - 0.28, pz, ry + Math.PI / 2, COL[(k + q) % COL.length]); }
        });
        r.stopMesh = B.mesh(new THREE.MeshLambertMaterial({ vertexColors: true })); r.stopMesh.receiveShadow = true; r.add(r.stopMesh);
        r.tags = KIT.tags(r);
      }
      r.btn = KIT.button(r, 'ODPRI VRATA');
      this.show(r);
    },
    // the front door's place: s along the road, across (m right of the centre line), and the bus's right side's gap to the kerb
    door(r) {
      const P = r.P, T = r.race.track, ch = Math.cos(P.h || 0), sh = Math.sin(P.h || 0), x = P.x + ch * K.DX, z = P.z + sh * K.DX;
      const p = r.stops[r.k]; if (!p) return null;
      let along = P.q ? P.q.s + K.DX - p.s : 0; along -= T.len * Math.round(along / T.len);   // (along the road; near the stop, along its own line)
      if (Math.abs(along) < 40) along = (x - p.x) * T.tx[p.i] + (z - p.z) * T.tz[p.i];
      const d = (P.x - p.x) * T.nx[p.i] + (P.z - p.z) * T.nz[p.i];
      return { along, kerb: p.w - (d + K.WID / 2) };
    },
    step(r, dt) {
      const P = r.P, T = r.race.track, R = r.ride;
      if (r.st !== 'board') R.step(P, dt);
      if (R.calm <= 0) { r.fail(tr('Potniki so padli: vozil si presunkovito.')); return; }
      const p = r.stops[r.k], v = Math.hypot(P.vx || 0, P.vz || 0), D = p ? this.door(r) : null;
      let say = null;
      if (r.st === 'board') {
        KIT.hold(P); P.stuckT = 0; P.wrongT = 0;
        r.board += dt;
        const f = r.board / K.BOARD, dx = T.px[p.i] + T.nx[p.i] * (p.w - 1.6), dz = T.pz[p.i] + T.nz[p.i] * (p.w - 1.6);
        if (r.crowd) p.pax.forEach((q, j) => { const g = Math.min(1, Math.max(0, f * 1.6 - j * 0.25)); if (g >= 1) { if (q.on) { q.on = false; r.crowd.hide(r.k * K.PAX + j); } } else { const ex = P.x + Math.cos(P.h) * K.DX, ez = P.z + Math.sin(P.h) * K.DX, x = q.x + (ex - q.x) * g, z = q.z + (ez - q.z) * g; r.crowd.put(r.k * K.PAX + j, x, p.ky - 0.28, z, Math.atan2(-(ez - q.z), ex - q.x) + Math.PI / 2); } });
        say = 'Potniki vstopajo …';
        if (r.board >= K.BOARD) { r.st = 'drive'; KIT.hold(P, false); r.served++; r.delay = r.t - p.sched; r.k++; }
      } else if (p) {
        const at = D && Math.abs(D.along) < K.DOOR && D.kerb > -0.5 && D.kerb < K.KERB;
        r.btn.show(at && v < K.VSTOP + 1);
        if (at && v < K.VSTOP) { if (r.btn.take() || r.autoDoor) { r.st = 'board'; r.board = 0; r.btn.show(false); } else say = 'Odpri vrata.'; }
        else if (D && D.along > -60 && D.along < K.DOOR) say = D.kerb > K.KERB ? 'Zapelji bliže pločniku.' : D.along < -K.DOOR ? 'Ustavi tako, da so vrata ob rumeni črti.' : null;
        else if (D && D.along >= K.DOOR && D.along < K.MISS) say = 'Prevozil si črto: vrata niso ob njej.';
        if (D && D.along >= K.MISS) { r.missed++; if (r.missed > K.MAXMISS) { r.fail(tr('Zgrešil si preveč postaj.')); return; } r.t += K.PEN; r.btn.show(false); if (r.crowd) p.pax.forEach((q, j) => r.crowd.hide(r.k * K.PAX + j)); r.k++; r.missT = 3; }
      }
      if (r.missT > 0) { r.missT -= dt; say = tr('Zgrešil si postajo: +{0} s.', K.PEN); }
      const imp = Math.max(P.hitWall || 0, P.hitCar || 0);
      r.say(say || (imp > 2 ? 'Trk! Potniki so padli po avtobusu.' : R.lon < -K.BRKA ? 'Zaviraj mehko: potniki stojijo.' : R.lat > K.LAT ? 'Prehitro v ovinek: potniki se držijo.' : this.hint));
      if (r.tags) { const q = r.stops[r.k]; r.tags.set(q && D && D.along > -250 ? [{ x: q.kx, y: q.ky + 4.2, z: q.kz, html: '<b>' + tr('POSTAJA') + '</b>' + tr('vrata ob rumeni črti'), cls: 'go' }] : []); }
      this.show(r);
    },
    // over the line: done if every stop is behind (served or missed)
    finish(r) { if (r.k >= r.stops.length) r.win(); else r.fail(tr('Nisi ustavil na vseh postajah.')); },
    show(r) {
      const n = r.stops ? r.stops.length : K.STOPS.length;
      r.set('post', Math.min(n, r.k + 1) + ' / ' + n);
      const d = Math.round(r.delay || 0), a = Math.abs(d);
      r.set('zam', (d >= 0 ? '+' : '−') + Math.floor(a / 60) + ':' + String(a % 60).padStart(2, '0'));
      const c = r.ride ? r.ride.calm : 1, st = c > 0 ? Math.max(1, Math.min(5, Math.round(c * 5))) : 0;
      r.set('udo', '★'.repeat(st) + '☆'.repeat(5 - st));
    },
  });
})();
