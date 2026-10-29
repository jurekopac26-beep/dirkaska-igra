/* Special mission 19 · Pred plimo · Townsville, Avstralija (js/missions.js; the kit: js/missions/kit.js, the water: MisKit.water, wade,
   crowd, tags). A sick fisherman waits on a small island in the creek's arm by Turn 1 (s K.ISL, K.OFF m right of the road: its own sand,
   palms, a hut and a footbridge from the road). The tide is coming in: the sea (a disc of water round Turn 1, MisKit.water) rises K.RISE m a
   second from K.L0 over the low road of Turn 1 (its lowest at K.LOW). The doctor's 4x4 (the MEDVED) drives there from the start line,
   stops at the footbridge (within K.ZONE m, slower than K.VSTOP), the doctor walks over to the island (K.WALK s), treats the fisherman
   (K.TREAT s) and walks back; meanwhile the car waits (held). With the doctor back in it, the car must get off the low road to the dry
   (s past K.DRY[1] forward or before K.DRY[0] back): done. The water on the road holds the car back (MisKit.wade), over K.SLIP m it slides,
   at K.DEEP m the engine drowns: failed; the time up: failed. The wrong way is allowed (back the way it came). */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js');
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s), dec = (s) => (typeof Lang !== 'undefined' ? Lang.dec(s) : String(s));
  const K = { ISL: 445, OFF: 36, R: 10, ZONE: 18, VSTOP: 1.5, WALK: 6, TREAT: 18, L0: -0.55, RISE: 1.05 / 150, LOW: -0.22, SLIP: 0.35, DEEP: 0.78, DRY: [330, 600], LIMIT: 180 };

  // the island: a sand mound in the water, grass on its top, palms, a fisherman's hut; the footbridge on posts to the road (one mesh)
  function island(r, p, road, ry) {
    if (typeof THREE === 'undefined') return;
    const B = KIT.parts(), SAND = 0xd9c48f, GR = 0x6f9a3c, TR = 0x7a5a3a, LF = 0x3f7a2a, WD = 0x8a6a48;
    const top = 0.95;
    B.L.push({ g: new THREE.CylinderGeometry(K.R * 0.75, K.R, 2.6, 20), m: new THREE.Matrix4().makeTranslation(0, top - 1.3, 0), c: SAND });
    B.L.push({ g: new THREE.CylinderGeometry(K.R * 0.55, K.R * 0.7, 0.3, 18), m: new THREE.Matrix4().makeTranslation(0.5, top + 0.05, 0.5), c: GR });
    for (const [x, z, h] of [[-5, -3, 7], [-3.5, 4, 8], [4.5, -4, 6.5], [6, 3, 7.5], [-6.5, 1, 6]]) {
      B.box(x, top + h / 2, z, 0.3, h, 0.3, TR);
      for (let k = 0; k < 4; k++) B.box(x + Math.cos(k * 1.57) * 1.2, top + h + 0.1, z + Math.sin(k * 1.57) * 1.2, k % 2 ? 0.7 : 2.6, 0.12, k % 2 ? 2.6 : 0.7, LF);
    }
    B.box(1.5, top + 1.3, -1.5, 3.6, 2.6, 3.0, 0xe9e1cf);
    { const g = KIT.prism(4.2, 3.6, 1.4); g.rotateY(0); B.L.push({ g, m: new THREE.Matrix4().makeTranslation(1.5, top + 2.6, -1.5), c: 0x9a4a32 }); }
    const isl = B.mesh(new THREE.MeshLambertMaterial({ vertexColors: true })); isl.castShadow = true;
    const g = new THREE.Group(); g.add(isl); g.position.set(p.x, 0, p.z); g.rotation.y = ry; r.add(g);
    // the footbridge: from the road's edge to the island, on posts (in the world: along the road's normal)
    const F = KIT.parts(), L = Math.hypot(p.x - road.x, p.z - road.z) - K.R * 0.8, mx = (p.x + road.x) / 2, mz = (p.z + road.z) / 2, a = Math.atan2(-(p.z - road.z), p.x - road.x);
    F.box(0, 0.75, 0, L, 0.12, 1.4, WD); for (let x = -L / 2 + 1; x < L / 2; x += 3) for (const sd of [-0.65, 0.65]) F.box(x, 0, sd, 0.15, 1.6, 0.15, 0x5a4330);
    for (const sd of [-0.72, 0.72]) F.box(0, 1.4, sd, L, 0.06, 0.06, WD);
    const fb = F.mesh(new THREE.MeshLambertMaterial({ vertexColors: true })); fb.position.set(mx - Math.cos(a) * K.R * 0.4, 0, mz + Math.sin(a) * K.R * 0.4); fb.rotation.y = a; r.add(fb);
  }
  // the lifeguard towers on the low road: posts in the water, a red box on top (the last shelter)
  function towers(r, T) {
    if (typeof THREE === 'undefined') return;
    for (const s of [395, 510]) {
      const p = KIT.at(T, s, -12), B = KIT.parts();
      for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) B.box(x, 2.2, z, 0.16, 4.4, 0.16, 0xd8dbe0);
      B.box(0, 4.6, 0, 2.6, 0.5, 2.6, 0xc4301c); B.box(0, 5.0, 0, 2.6, 0.08, 2.6, 0xe8452c);
      const m = B.mesh(new THREE.MeshLambertMaterial({ vertexColors: true })); m.position.set(p.x, Math.min(p.y, p.ty) - 0.6, p.z); m.rotation.y = p.ry; r.add(m);
    }
  }

  Missions.add({
    id: '19', title: 'Pred plimo', track: 'townsville', car: 'medved', limit: K.LIMIT, stars: [95, 130], K,
    story: 'Na otočku pred obalo čaka bolan ribič. Cesta čez plitvino je suha samo ob oseki.',
    goal: 'Pripelji zdravnika na otok, preden morje prekrije cesto.',
    hint: 'Ko voda doseže kolesa, avto začne drseti.',
    rows: [{ k: 'sea', label: 'MORJE NA CESTI', bar: true, col: '#3d8cff' }, { k: 'isl', label: 'OTOK' }, { k: 'doc', label: 'ZDRAVNIK' }],
    // alone on the closed streets, dry, by day; the doctor's MEDVED 4x4 in white
    opts: () => ({ tt: true, laps: 1, playerColor: 0xf2f4f6, damage: 0 }),
    begin(r) {
      const T = r.race.track, i = T.idx(K.ISL);
      r.lvl = K.L0; r.doc = 'car'; r.dt = 0; r.depth = 0;
      r.cur = [T.nx[i] * 0.6, T.nz[i] * 0.6];   // (the tide pushes across the road, inland)
      r.W = KIT.water(r, { x: T.px[i], z: T.pz[i], size: 640, y: r.lvl, col: 0x3f8a96, op: 0.86, shine: 60 });
      r.isl = KIT.at(T, K.ISL, K.OFF); r.foot = KIT.at(T, K.ISL, T.wS(K.ISL) + 1.5);
      island(r, r.isl, r.foot, Math.atan2(-T.tz[i], T.tx[i])); towers(r, T);
      r.crowd = KIT.crowd(r, 2); r.tags = KIT.tags(r);
      r.crowd.put(1, r.isl.x + 1.5, 0.95, r.isl.z + 1.5, 0, 0x2f6f9e);   // (the fisherman, by his hut)
      this.show(r);
    },
    step(r, dt) {
      const P = r.P, T = r.race.track, s = P.q ? P.q.s : 0, v = Math.hypot(P.vx || 0, P.vz || 0);
      P.wrongT = 0;   // (back the way it came: allowed)
      // the tide rises; on the road it holds the car back, then it slides, then the engine drowns
      r.lvl = K.L0 + K.RISE * r.t; r.W.set(r.lvl);
      r.depth = Math.max(0, r.lvl - (P.roadY != null ? P.roadY : P.y || 0));
      KIT.wade(P, r.depth, dt, { drag: 1.4, deep: K.DEEP, slip: K.SLIP, cur: r.cur });
      if (r.depth >= K.DEEP) r.fail(tr('Morje je zalilo avto.'));
      const near = Math.abs(s - K.ISL) < K.ZONE;
      // at the footbridge: the doctor walks to the island, treats the fisherman, walks back (the car waits)
      if (r.doc === 'car' && near && v < K.VSTOP) { r.doc = 'out'; r.dt = 0; }
      if (r.doc !== 'car' && r.doc !== 'back') {
        KIT.hold(P); P.stuckT = 0; r.dt += dt;
        const a = { x: P.x, z: P.z }, b = { x: r.isl.x - 1, z: r.isl.z };
        let f = 0;
        if (r.doc === 'out') { f = Math.min(1, r.dt / K.WALK); if (f >= 1) { r.doc = 'treat'; r.dt = 0; } }
        else if (r.doc === 'treat') { f = 1; if (r.dt >= K.TREAT) { r.doc = 'in'; r.dt = 0; } }
        else if (r.doc === 'in') { f = 1 - Math.min(1, r.dt / K.WALK); if (f <= 0) { r.doc = 'back'; KIT.hold(P, false); } }
        if (r.doc !== 'back') r.crowd.put(0, a.x + (b.x - a.x) * f, (P.roadY || 0) + (0.95 - (P.roadY || 0)) * f, a.z + (b.z - a.z) * f, 0, 0xf4f6f8); else r.crowd.hide(0);
      }
      // with the doctor back: off the low road onto the dry
      if (r.doc === 'back' && (s > K.DRY[1] || s < K.DRY[0]) && r.depth <= 0.02) r.win();
      r.tags.set(r.doc === 'car' ? [{ x: r.isl.x, y: 9, z: r.isl.z, cls: 'go', html: '<b>' + tr('OTOK') + '</b>' + tr('ribič čaka') }] : []);
      r.say(r.doc === 'car' ? (near ? 'Ustavi ob brvi.' : r.depth > K.SLIP ? 'Ko voda doseže kolesa, avto začne drseti.' : this.hint)
        : r.doc === 'back' ? 'Zdravnik je v avtu: odpelji ga na suho, preden morje zalije cesto.' : r.doc === 'treat' ? 'Zdravnik oskrbuje ribiča …' : 'Zdravnik gre po brvi.');
      this.show(r);
    },
    // round the lap to the finish line: done if the doctor is back in the car
    finish(r) { if (r.doc === 'back') r.win(); else r.fail(tr('Zapeljal si mimo otoka.')); },
    show(r) {
      const P = r.P, T = r.race.track, s = P && P.q ? P.q.s : 0, on = r.lvl - K.LOW;
      r.set('sea', (on >= 0 ? '+' : '−') + dec(Math.abs(on).toFixed(1)) + ' m', Math.max(0, Math.min(1, (on + 0.3) / (K.DEEP + 0.3))), on > K.SLIP ? '#e8452c' : '#3d8cff');
      const d = Math.abs(K.ISL - s);
      r.set('isl', r.doc === 'car' ? (d > 1000 ? dec((d / 1000).toFixed(1)) + ' km' : Math.round(d) + ' m') : tr('tukaj'));
      r.set('doc', r.doc === 'car' ? tr('v avtu') : r.doc === 'back' ? tr('nazaj v avtu') : r.doc === 'treat' ? tr('oskrba {0} %', Math.round(100 * Math.min(1, r.dt / K.TREAT))) : tr('na brvi'));
    },
  });
})();
