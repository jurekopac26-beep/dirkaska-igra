/* Special mission 26 · Zadnji odstotek · Tianmen, Kitajska (js/missions.js; the kit: js/missions/kit.js). The electric car (the game's
   STRELA EV) stands K.TOP m below the finish line at the top of the road of 99 bends with 3 % in its battery; the charger is in the valley,
   K.END m before the start line (the road driven down: MisKit.place back, the wrong way allowed). The battery (BATERIJA) runs down by
   itself (the car's systems, lights and heating: K.BASE kW) and fast on the throttle (up to K.DRIVE kW); the brake gives it back
   (regeneration: the power the brakes take, the car's weight times its speed times the slowing the slope and the brakes give, up to
   K.REGEN kW, of it K.EFF into the battery; harder braking than that is lost in the friction brakes). REKUPERACIJA: what the last
   braking gave back. DOMET: the battery over the use of the last stretch; DO POLNILNICE: the way left. Empty before the charger: failed;
   at the charger: done. A tag over the charger shows it far below (its distance). */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js');
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s);
  const dec = (s) => (typeof Lang !== 'undefined' && Lang.dec ? Lang.dec(s) : String(s).replace('.', ','));
  const K = { TOP: 30, END: 45, B0: 3, CAP: 2160, BASE: 8, DRIVE: 150, REGEN: 45, EFF: 0.65, G: 9.81 };

  // the charger in the valley: a canopy on four posts, two charging posts with their screens (green: free), the bay's lines
  function charger(T, s, side) {
    const w = T.wS(s), p = KIT.at(T, s, side * (w + 4.5)), B = KIT.parts(), G = KIT.parts();
    B.box(0, 3.3, 0, 7.0, 0.22, 5.2, 0xe8ecef); B.box(0, 3.15, 0, 7.1, 0.1, 5.3, 0x2f9e5a);
    for (const x of [-3.2, 3.2]) for (const z of [-2.3, 2.3]) B.box(x, 1.6, z, 0.18, 3.2, 0.18, 0x8f979f);
    for (const x of [-1.6, 1.6]) { B.box(x, 0.85, -2.0, 0.55, 1.7, 0.4, 0xf4f6f8); G.box(x, 1.25, -1.79, 0.38, 0.42, 0.02, 0); }
    B.box(0, 0.02, 0, 0.12, 0.03, 4.6, 0xffffff); B.box(-3.1, 0.02, 0, 0.12, 0.03, 4.6, 0xffffff); B.box(3.1, 0.02, 0, 0.12, 0.03, 4.6, 0xffffff);
    const g = new THREE.Group();
    const m = B.mesh(new THREE.MeshLambertMaterial({ vertexColors: true })); m.castShadow = true; g.add(m);
    g.add(new THREE.Mesh(KIT.merged(G.L), new THREE.MeshBasicMaterial({ color: 0x3cff8a })));
    g.position.set(p.x, p.y, p.z); g.rotation.y = p.ry + (side > 0 ? Math.PI : 0);   // (its posts on the far side, the bays open to the road)
    return { g, x: p.x, y: p.y, z: p.z };
  }

  Missions.add({
    id: '26', title: 'Zadnji odstotek', track: 'tianmen', car: 'ev', limit: 600, stars: [400, 500], K,
    story: 'Baterija kaže 3 %. Do polnilnice v dolini vodi cesta z 99 ovinki.',
    goal: 'Spusti se do polnilnice, preden se baterija izprazni.',
    hint: 'Zaviraj z motorjem: na vsakem ovinku dobiš nekaj energije.',
    rows: [{ k: 'baterija', label: 'BATERIJA', bar: true }, { k: 'domet', label: 'DOMET' }, { k: 'polnilnica', label: 'DO POLNILNICE' }, { k: 'rekup', label: 'REKUPERACIJA' }],
    // alone on the closed road
    opts: () => ({ tt: true }),
    // the car K.TOP m below the finish line at the top, facing down the road
    made(race) { const T = race.track, c = race.player; if (c) KIT.place(c, T, T.finishS - K.TOP, true); },
    begin(r) {
      const T = r.race.track;
      r.b = K.B0; r.sEnd = T.startS - K.END; r.vf = 0; r.acc = 0; r.gain = 0; r.gainT = 0; r.lastGain = 0; r.braking = false; r.lost = 0;
      r.use = [];   // (the battery's use over the last stretch: [s, b] every 25 m, for DOMET)
      KIT.backRoad(r);
      if (typeof THREE !== 'undefined' && typeof document !== 'undefined') {
        const j = T.idx(r.sEnd), side = T.br && T.bl && T.br[j] >= T.bl[j] ? 1 : -1;
        r.ch = charger(T, r.sEnd, side); r.add(r.ch.g);
        r.tags = KIT.tags(r);
      }
      this.show(r);
    },
    step(r, dt) {
      const P = r.P, T = r.race.track, q = P.q; if (!q) return;
      P.wrongT = 0;   // (down the road made to be driven up)
      const m = (P.m && P.m.mass) || 1720, v = Math.hypot(P.vx || 0, P.vz || 0), ch = Math.cos(P.h), sh = Math.sin(P.h), vf = (P.vx || 0) * ch + (P.vz || 0) * sh;
      const a = (vf - r.vf) / Math.max(1e-3, dt); r.vf = vf; r.acc += (a - r.acc) * Math.min(1, dt * 5);
      // the slope's pull along the way the car goes (down the road: the road's grade against s)
      const i = T.idx(q.s), dir = (P.vx || 0) * T.tx[i] + (P.vz || 0) * T.tz[i] < 0 ? -1 : 1, gA = -K.G * (T.grade ? T.grade[i] : 0) * dir;
      let kw = K.BASE + (P.inThr || 0) * K.DRIVE * Math.min(1, Math.max(0.25, v / 15)), back = 0;
      const brk = (P.inBrk || 0) > 0.1 && v > 1.5;
      if (brk) { const pb = m * v * Math.max(0, gA - r.acc) / 1000; back = Math.min(K.REGEN, pb) * K.EFF; if (pb > K.REGEN * 1.3) r.lost += dt; }
      const d = (back - kw) * dt / K.CAP;   // (% of the battery)
      r.b = Math.min(100, r.b + d);
      // REKUPERACIJA: what one braking gave back (shown a while after it)
      if (brk) { if (!r.braking) { r.braking = true; r.gain = 0; } r.gain += back * dt / K.CAP; r.gainT = 3; }
      else { if (r.braking) { r.braking = false; r.lastGain = r.gain; } r.gainT = Math.max(0, r.gainT - dt); }
      // DOMET: the battery over its use on the last ~400 m
      const U = r.use, lu = U[U.length - 1]; if (!lu || Math.abs(q.s - lu[0]) >= 25) { U.push([q.s, r.b]); if (U.length > 16) U.shift(); }
      if (r.b <= 0) { r.b = 0; this.show(r); r.fail(tr('Baterija se je izpraznila pred polnilnico.')); return; }
      if (q.s <= r.sEnd) { r.win(); this.show(r); return; }
      if (r.tags && r.ch) r.tags.set([{ x: r.ch.x, y: r.ch.y + 5, z: r.ch.z, html: '<b>' + tr('POLNILNICA') + '</b>' + dec((Math.max(0, q.s - r.sEnd) / 1000).toFixed(1)) + ' km', cls: 'go' }]);
      r.say((P.inThr || 0) > 0.3 && v > 6 ? 'Plin hitro prazni baterijo: pusti avto, da se spušča sam.' : brk && r.lost > 0.6 ? 'Premočno zaviraš: del energije gre v zavore. Zaviraj prej in nežneje.' : this.hint);
      if (!brk) r.lost = Math.max(0, r.lost - dt);
      this.show(r);
    },
    finish(r) { r.win(); },
    show(r) {
      const s = r.P.q ? r.P.q.s : r.race.track.finishS, left = Math.max(0, s - r.sEnd), U = r.use || [];
      r.set('baterija', dec(r.b.toFixed(1)) + ' %', Math.min(1, r.b / 10), r.b < 1 ? '#e8452c' : r.b < 2 ? '#ffb020' : '#3fbf6a');
      // the range: the battery left over the use per metre of the last stretch (none used: more than the way left)
      let range = null;
      if (U.length >= 3) { const a = U[0], b = U[U.length - 1], per = (a[1] - b[1]) / Math.max(1, Math.abs(a[0] - b[0])); range = per > 1e-6 ? r.b / per : Infinity; }
      r.set('domet', range == null ? '—' : range === Infinity || range > 99000 ? '∞' : dec((range / 1000).toFixed(1)) + ' km', null, range != null && range < left ? '#e8452c' : null);
      r.set('polnilnica', dec((left / 1000).toFixed(1)) + ' km');
      const g = r.braking ? r.gain : r.gainT > 0 ? r.lastGain : 0;
      r.set('rekup', '+' + dec(g.toFixed(2)) + ' %', null, g > 0 ? '#3fbf6a' : null);
    },
    // the tests' and the pictures' driver: down the road (o.v, o.lat: tools/misija-slika.mjs)
    pilot(r, o) { return KIT.pilot(r.P, r.race.track, Object.assign({ dir: -1, v: 11, lat: 2.6 }, o)); },
  });
})();
