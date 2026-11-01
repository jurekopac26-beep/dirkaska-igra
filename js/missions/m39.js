/* Special mission 39 · Konji v prikolici · Monterey, ZDA (js/missions.js; the kit: js/missions/kit.js, MisKit.ride, trailer, house, rails).
   Two horses go to their new stable over the golden hills: the off-roader (MEDVED 4x4, its own limiter K.VMAX, soft brakes with the
   trailer's weight: brakeK K.BRK, full brake ~3.6 m/s2) pulls a horse trailer (MisKit.trailer: swinging behind it on the hitch; the
   horses' backs in its open upper door). One lap of the circuit to the stable beside the road before the line (a red barn, MisKit.house,
   and its paddock, MisKit.rails). MIR KONJ (the horses' calm, MisKit.ride): a bend taken too fast (the pull across over K.LAT m/s2) or a
   knock lowers it, every jolt counted (SUNKI); smooth driving slowly brings it back. At 0 the horses panic: failed. Over the line with
   the horses calm: done. */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js');
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s), dec = (s) => (typeof Lang !== 'undefined' ? Lang.dec(s) : String(s));
  const K = { VMAX: 90, BRK: 0.2, LAT: 4.0, DROP: 0.14, KNOCK: 0.25, REC: 0.025, BARN: 45 };
  const SIL = 0xd9dde2, BUR = 0x7a1f2b, BLK = 0x1b1d21, GRY = 0x8a9198, HOR = 0x6a4128, HOR2 = 0x3a2416;

  // the horse trailer: from the hitch (x 0) back, its body 4.4 m (silver, a burgundy band), the drawbar, two wheels each side, the upper
  // rear door open with the two horses' backs and tails in it
  function horseBox(B) {
    B.box(-0.6, 0.62, 0, 1.2, 0.12, 0.14, GRY);
    B.box(-3.4, 1.55, 0, 4.4, 2.1, 2.05, SIL); B.box(-3.4, 2.65, 0, 4.3, 0.14, 1.95, 0xeef0f2);
    B.box(-3.4, 1.0, 0, 4.42, 0.32, 2.07, BUR); B.box(-1.22, 1.65, 0, 0.12, 1.9, 1.95, SIL);
    for (const sd of [-1, 1]) { B.box(-2.4, 2.05, sd * 1.03, 1.6, 0.45, 0.02, 0x1d2733); B.cyl(-3.75, 0.36, sd * 1.0, 0.36, 0.24, BLK); B.cyl(-4.55, 0.36, sd * 1.0, 0.36, 0.24, BLK); B.box(-4.15, 0.78, sd * 1.06, 1.7, 0.08, 0.14, SIL); }
    B.box(-5.6, 1.15, 0, 0.04, 1.3, 2.0, 0xc9ced4); B.box(-5.6, 2.25, 0, 0.04, 0.9, 2.0, 0x26221e);   // (the lower rear door shut, the upper open: dark inside)
    for (const z of [-0.48, 0.48]) { B.box(-5.25, 2.05, z, 0.7, 0.62, 0.62, z < 0 ? HOR : HOR2); B.box(-5.62, 1.85, z, 0.06, 0.55, 0.14, BLK); }
    for (const [x, z] of [[-5.62, 0.8], [-5.62, -0.8]]) B.box(x, 0.7, z, 0.04, 0.16, 0.24, 0xff3a2a);
  }

  Missions.add({
    id: '39', title: 'Konji v prikolici', track: 'monterey', limit: 420, stars: [235, 300], K,
    story: 'Dva konja morata do novega hleva. Cesta vijuga čez zlate griče.',
    goal: 'Pripelji konja do hleva mirna: zaviraj zgodaj in skozi ovinke pelji počasi.',
    hint: 'Konji čutijo vsak sunek: zaviraj zgodaj in skozi ovinke pelji počasi.',
    rows: [{ k: 'mir', label: 'MIR KONJ', bar: true }, { k: 'sunki', label: 'SUNKI' }, { k: 'hlev', label: 'DO HLEVA' }],
    // alone, one lap, dry, by day; the off-roader slow with soft brakes, the trailer's weight
    opts: () => ({ tt: true, laps: 1, playerModel: KIT.truckModel('medved', { vLim: K.VMAX, brakeK: K.BRK }), playerColor: 0x2c5a3a, damage: 0 }),
    begin(r) {
      const T = r.race.track;
      r.ride = KIT.ride({ lat: K.LAT, drop: K.DROP, knock: K.KNOCK, rec: K.REC });
      if (typeof Render !== 'undefined' && Render.setAtmos) Render.setAtmos({ season: 'summer', tod: 'day' }, true);
      if (typeof THREE !== 'undefined' && typeof document !== 'undefined') {
        r.trl = KIT.trailer(r, r.P, horseBox, { hitch: -2.55, L: 4.15 });
        // the stable before the line on the road's roomier side: the barn, its paddock toward the road
        const s = (T.finishS || T.len) - K.BARN, i = T.idx(s), side = T.br[i] >= T.bl[i] ? 1 : -1, w = T.wS(s);
        const p = KIT.at(T, s, side * (w + 22)); r.barn = KIT.house(r, p, { L: 16, W: 10, H: 4.6, roof: 0x4a4f55, wall: 0xa3312a, ry: p.ry });
        const B = KIT.parts(), q = KIT.at(T, s, side * (w + 10)), y0 = q.y;
        const c = Math.cos(p.ry), sn = Math.sin(p.ry), L = (u, v) => [u * c + v * sn, -u * sn + v * c];   // (the paddock in the road's frame: u along, v across)
        const corner = [[-14, -5], [14, -5], [14, 5], [-14, 5]].map(([u, v]) => L(u, v * side));
        for (let k = 0; k < 4; k++) { const a = corner[k], b = corner[(k + 1) % 4]; KIT.rails(B, a[0], a[1], b[0], b[1], 0, { every: 3 }); }
        const m = B.mesh(new THREE.MeshLambertMaterial({ vertexColors: true })); m.position.set(q.x, y0, q.z); r.add(m); r.pad = m;
        r.tags = KIT.tags(r); r.barnAt = { x: p.x, y: p.y + 9, z: p.z, s };
      }
      this.show(r);
    },
    step(r, dt) {
      const P = r.P, T = r.race.track, R = r.ride;
      R.step(P, dt);
      if (R.calm <= 0) { r.fail(tr('Konja sta se preplašila.')); return; }
      const imp = Math.max(P.hitWall || 0, P.hitCar || 0);
      r.say(imp > 2 ? 'Trk! Konja sta se ustrašila.' : R.lat > K.LAT ? 'Prehitro v ovinek: konja izgubljata ravnotežje.' : R.calm < 0.35 ? 'Konja sta nemirna: nekaj časa pelji čisto mirno.' : this.hint);
      r.toGo = Math.max(0, (T.raceLen || T.len) - Math.max(0, P.dist));
      if (r.tags && r.barnAt) r.tags.set(r.toGo < 350 ? [{ x: r.barnAt.x, y: r.barnAt.y, z: r.barnAt.z, html: '<b>' + tr('HLEV') + '</b>' + Math.round(r.toGo) + ' m', cls: 'go' }] : []);
      this.show(r);
    },
    show(r) {
      const c = r.ride ? r.ride.calm : 1;
      r.set('mir', Math.round(c * 100) + ' %', c, c > 0.6 ? '#3fbf6a' : c > 0.3 ? '#ffb020' : '#e8452c');
      r.set('sunki', String(r.ride ? r.ride.n : 0));
      const T = r.race.track, left = r.toGo != null ? r.toGo : (T.raceLen || T.len);
      r.set('hlev', left >= 1000 ? dec((left / 1000).toFixed(1)) + ' km' : Math.round(left) + ' m');
    },
  });
})();
