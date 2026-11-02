/* Special mission 50 · Panji na pašo · Medvode, Slovenija (js/missions.js; the kit: js/missions/kit.js, MisKit.ride, skin). The lime trees
   are in bloom: in the evening, with all the bees home, the beekeeper takes the travelling apiary (a small lorry, MisKit.skin over the
   off-roader's physics with its own limiter and soft brakes; on its bed the bee house with its painted hive fronts toward the back) from
   past the Sava bridge (K.S0 m past the start line) through Valburga and Smlednik and up the gravel castle road to the lime tree at the
   finish below the castle. ČEBELE (the bees' calm, MisKit.ride): a bend too fast, a knock, a pothole (K.HOLES of them, dark patches on
   the road: a wheel in one jolts the load, harder the faster; drive round them) upset them; smooth driving calms them again; at 0 they
   swarm out: failed. SONCE ZAIDE: the sun sets as the time runs (the light to dusk: Render.setTodK); at the limit it is dark: failed.
   On the way a hay rack (kozolec) beside the castle road; at the finish the lime tree. */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js');
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s), dec = (s) => (typeof Lang !== 'undefined' ? Lang.dec(s) : String(s));
  // the holes: [s past the start line, across (m from the centre line, + on the normal's side)]
  const HOLES = [[4060, -1.6], [4240, 1.8], [4420, 0], [4610, -2.2], [4830, 1.2], [5010, -1.0], [5290, 1.4], [5380, -1.2], [5470, 0.4], [5600, -1.6], [5720, 1.5], [5830, -0.6], [5960, 1.0], [6080, -1.4], [6190, 0.6]];
  const K = { S0: 3880, VMAX: 70, BRK: 0.2, LAT: 4.0, DROP: 0.12, KNOCK: 0.25, REC: 0.012, HOLE: 0.75, HIT: 0.2, HITV: 10, TOD0: 0.12, TOD1: 0.62, HOLES };
  const BOX = 0x2b5d8f, CAB = 0xe8eaec, BLK = 0x1b1d21, WOOD = 0x8a6038, ROOF = 0x6b3a26, GLS = 0x1d2733;
  const PAINT = [0xd8402c, 0x2f6fc0, 0xe2b52b, 0x3f9a4a, 0xf0ede4, 0x8a3fa0];

  // the lorry: the cab in front, the flat bed, on it the bee house (a wooden hut with a gable roof): its back of 4 x 3 hive fronts, each
  // painted (the fronts with their bright colours and a dark entry slot), as the player sees it from behind
  function lorry(B) {
    B.box(1.75, 1.35, 0, 1.7, 1.75, 2.1, CAB); B.box(2.61, 1.6, 0, 0.04, 0.8, 1.9, GLS); B.box(1.75, 2.25, 0, 1.6, 0.06, 2.0, BOX);
    B.box(-0.9, 0.78, 0, 4.0, 0.2, 2.3, 0x3a3e44);
    B.box(-0.95, 1.95, 0, 3.6, 2.1, 2.2, WOOD); B.L.push({ g: KIT.prism(3.9, 2.6, 0.65), m: new THREE.Matrix4().makeTranslation(-0.95, 3.0, 0), c: ROOF });
    for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) {
      const z = -0.82 + col * 0.55, y = 1.25 + row * 0.6, c = PAINT[(row * 4 + col * 3) % PAINT.length];
      B.box(-2.78, y, z, 0.04, 0.5, 0.48, c); B.box(-2.8, y - 0.16, z, 0.03, 0.06, 0.22, BLK);
    }
    for (const x of [1.75, -1.9]) for (const sd of [-1, 1]) B.cyl(x, 0.45, sd * 1.0, 0.45, 0.3, BLK);
    B.box(-2.95, 0.85, 0.95, 0.04, 0.18, 0.25, 0xff3a2a); B.box(-2.95, 0.85, -0.95, 0.04, 0.18, 0.25, 0xff3a2a);
  }
  // the hay rack (kozolec toplar's smaller sister, a stegnjenec): posts in a row, the slats between them, a little roof of its own
  function kozolec(B) {
    for (let k = 0; k < 5; k++) B.box(-6 + k * 3, 3.0, 0, 0.3, 6.0, 0.3, 0x6a4a2c);
    for (let k = 0; k < 7; k++) B.box(0, 1.0 + k * 0.7, 0, 12.0, 0.1, 0.12, 0x9a7444);
    B.box(0, 3.2, 0.05, 11.6, 3.2, 0.06, 0xc8b060);   // (the hay drying in it)
    B.box(0, 6.25, 0, 13.0, 0.12, 1.8, 0x5a3424);
  }
  // the lime tree: its trunk and a round crown in flower
  function lipa(B) {
    B.box(0, 2.0, 0, 0.9, 4.0, 0.9, 0x4a3a2a);
    B.box(0, 7.0, 0, 9.0, 6.0, 9.0, 0x5f8a3a); B.box(0, 7.6, 0, 7.0, 6.8, 10.0, 0x6d9a42); B.box(0, 7.4, 0, 10.0, 5.2, 7.0, 0x67913e);
    B.box(0, 10.6, 0, 5.0, 1.4, 5.0, 0x7aa64a);
  }
  // a pothole's dark patch (its rim lighter)
  function holeMesh(B, x, y, z) { B.disc(x, y, z, K.HOLE + 0.15, 0.02, 0x8a7e6c); B.disc(x, y + 0.012, z, K.HOLE, 0.02, 0x2e2a24); }

  Missions.add({
    id: '50', title: 'Panji na pašo', track: 'medvode', limit: 300, stars: [195, 240], K,
    story: 'Lipa cveti. Čebelar mora zvečer, ko so vse čebele doma, prepeljati čebelnjak na pašo.',
    goal: 'Pripelji čebelnjak do lipe brez sunkov in lukenj, da čebele ostanejo mirne, preden se stemni.',
    hint: 'Pelji mehko: vsak sunek razburi čebele, zato luknje obvozi.',
    rows: [{ k: 'cebele', label: 'ČEBELE', bar: true }, { k: 'sunki', label: 'SUNKI' }, { k: 'pasa', label: 'DO PAŠE' }, { k: 'sonce', label: 'SONCE ZAIDE' }],
    // alone on the open road (closed for the others), dry, in the evening; the lorry slow with soft brakes, no damage
    opts: () => ({ tt: true, laps: 1, playerModel: KIT.truckModel('medved', { vLim: K.VMAX, brakeK: K.BRK, len: 5.6 }), playerColor: CAB, damage: 0 }),
    made(race) {
      const T = race.track, c = race.player; if (!c) return;
      const s = T.startS + K.S0, i = T.idx(s);
      c.place(T.px[i], T.pz[i], T.hd[i]); if (T.hasElev) { c.y = c.py = T.hy[i]; c.roadY = c.y; }
      c.dist = s - T.startS; c.q = T.query(T.px[i], T.pz[i], i, {}); c.sPrev = c.q.s;
      while (c.cp < T.cpS.length && c.dist >= T.cpDist[c.cp]) { c.splits.push(0); c.cp++; }
    },
    begin(r) {
      const T = r.race.track;
      r.ride = KIT.ride({ lat: K.LAT, drop: K.DROP, knock: K.KNOCK, rec: K.REC });
      r.holes = HOLES.map(([s, d]) => { const i = T.idx(T.startS + s); return { s: T.startS + s, x: T.px[i] + T.nx[i] * d, z: T.pz[i] + T.nz[i] * d, y: T.hy[i], inT: 0 }; });
      r.tod = -1;
      if (typeof Render !== 'undefined' && Render.setAtmos) { Render.setAtmos({ season: 'summer', tod: 'day' }, true); this.light(r); }
      if (typeof THREE !== 'undefined' && typeof document !== 'undefined') {
        r.skin = KIT.skin(r, r.P, lorry);
        if (r.skin) { const v = Render.viewOf(r.P); if (v && v.lights && v.lights.length >= 4) { v.lights[0].set(2.63, 1.0, -0.8); v.lights[1].set(2.63, 1.0, 0.8); v.lights[2].set(-2.97, 0.85, -0.95); v.lights[3].set(-2.97, 0.85, 0.95); } }
        // the bees out of their hives when upset: a cloud round the bee house (one Points draw, as many as the calm is low)
        const n = 60, pos = new Float32Array(n * 3);
        for (let k = 0; k < n; k++) { pos[k * 3] = -1 - Math.random() * 3.2; pos[k * 3 + 1] = 1.2 + Math.random() * 2.6; pos[k * 3 + 2] = (Math.random() - 0.5) * 3.2; }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setDrawRange(0, 0);
        r.bees = new THREE.Points(g, new THREE.PointsMaterial({ color: 0x2a2010, size: 0.09 })); r.bees.frustumCulled = false; if (r.skin) r.skin.add(r.bees);
        const H = KIT.parts(); for (const h of r.holes) holeMesh(H, h.x, h.y + 0.05, h.z);
        const hm = H.mesh(new THREE.MeshLambertMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); hm.receiveShadow = true; r.add(hm); r.holeMesh = hm;
        // the hay rack beside the castle road, the lime tree beside the finish (both on the road's roomier side)
        const put = (s, off, build) => { const i = T.idx(s), sd = T.br[i] >= T.bl[i] ? 1 : -1, p = KIT.at(T, s, sd * (T.wS(s) + off)), B = KIT.parts(); build(B); const m = B.mesh(new THREE.MeshLambertMaterial({ vertexColors: true })); m.castShadow = true; m.position.set(p.x, p.y - 0.1, p.z); m.rotation.y = p.ry; r.add(m); return { m, p }; };
        r.koz = put(T.startS + 5330, 9, kozolec).m;
        const L = put(T.finishS + 6, 9, lipa); r.lipa = L.m; r.lipaAt = { x: L.p.x, y: L.p.y + 13, z: L.p.z };
        r.tags = KIT.tags(r);
      }
      this.show(r);
    },
    // the evening light: from late afternoon to dusk as the time runs (a step every few seconds)
    light(r) {
      if (typeof Render === 'undefined' || !Render.setTodK) return;
      const k = K.TOD0 + (K.TOD1 - K.TOD0) * Math.min(1, r.t / r.def.limit), q = Math.round(k * 50) / 50;
      if (q !== r.tod) { r.tod = q; Render.setTodK(q); }
    },
    step(r, dt) {
      const P = r.P, T = r.race.track, R = r.ride;
      if (r.t >= r.def.limit) { r.fail(tr('Sonce je zašlo, preden si prišel do lipe.')); return; }
      R.step(P, dt);
      // the holes: a wheel in one (the four wheels' places), harder the faster
      const v = Math.hypot(P.vx || 0, P.vz || 0), ch = Math.cos(P.h || 0), sh = Math.sin(P.h || 0), qs = P.q ? P.q.s : 0;
            for (const h of r.holes) {
        if (h.done || Math.abs(h.s - qs) > 12) continue;
        let inn = false;
        for (const [u, w] of [[1.75, 1.0], [1.75, -1.0], [-1.9, 1.0], [-1.9, -1.0]]) { const x = P.x + ch * u - sh * w, z = P.z + sh * u + ch * w; if (Math.hypot(x - h.x, z - h.z) < K.HOLE) { inn = true; break; } }
        if (inn && v > 1) { R.jolt(K.HIT * Math.min(2, 0.4 + v / K.HITV)); h.done = true; r.holeT = 1.5; }   // (once a hole: the rear wheels in it too are the same jolt)
      }
      if (r.holeT > 0) r.holeT -= dt;
      if (R.calm <= 0) { r.fail(tr('Čebele so se razjezile.')); return; }
      if (Math.floor(r.t / 3) !== Math.floor((r.t - dt) / 3)) this.light(r);
      const imp = Math.max(P.hitWall || 0, P.hitCar || 0);
      r.say(r.holeT > 0 ? 'Luknja! Čebele brenčijo: luknje obvozi.' : imp > 2 ? 'Trk! Čebele so se vznemirile.' : R.lat > K.LAT ? 'Prehitro v ovinek: čebelnjak se ziba.' : R.calm < 0.35 ? 'Čebele so nemirne: pelji čisto mirno.' : this.hint);
      if (r.bees) r.bees.geometry.setDrawRange(0, Math.round(60 * Math.max(0, 1 - R.calm / 0.7)));
      r.toGo = Math.max(0, (T.raceLen || T.len) - Math.max(0, P.dist));
      if (r.tags && r.lipaAt) r.tags.set(r.toGo < 400 ? [{ x: r.lipaAt.x, y: r.lipaAt.y, z: r.lipaAt.z, html: '<b>' + tr('LIPA') + '</b>' + Math.round(r.toGo) + ' m', cls: 'go' }] : []);
      this.show(r);
    },
    show(r) {
      const c = r.ride ? r.ride.calm : 1;
      r.set('cebele', c > 0.6 ? tr('mirne') : c > 0.3 ? tr('nemirne') : tr('jezne'), c, c > 0.6 ? '#3fbf6a' : c > 0.3 ? '#ffb020' : '#e8452c');
      r.set('sunki', String(r.ride ? r.ride.n : 0));
      const T = r.race.track, left = r.toGo != null ? r.toGo : (T.raceLen || T.len) - K.S0;
      r.set('pasa', left >= 1000 ? dec((left / 1000).toFixed(1)) + ' km' : Math.round(left) + ' m');
      const sun = Math.max(0, r.def.limit - r.t);
      r.set('sonce', sun >= 60 ? tr('čez {0} min', Math.ceil(sun / 60)) : tr('čez {0} s', Math.ceil(sun)));
    },
  });
})();
