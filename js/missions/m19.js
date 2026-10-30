/* Special mission 19 · Pred plimo · Townsville, Avstralija (js/missions.js; the kit: js/missions/kit.js: crowd, tags, wade, hold). A sick
   fisherman waits on a small island in the creek where it passes under the low road of Turn 1 (s K.ISL, K.OFF m left of the road, K.SIDE:
   ahead of the car on the left, in view on an upright phone; its own sand, palms, a hut and a footbridge from the road). The tide is coming in: the sea (the mission's own water over the low ground round Turn 1:
   flat within K.R0 m of its centre, its rim sinking K.DROP m under the ground by K.R1 m, so its edge never shows) rises K.RISE m a second
   from K.L0 over the low road (its lowest at K.LOW). The doctor's 4x4 (the MEDVED, white) drives there from the start line, stops in the
   yellow box painted on the road before the footbridge (s K.STOP ± K.ZONE, or on up to the footbridge; slower than K.VSTOP), the doctor walks
   along the road's edge and over to the island (K.WALK s), treats the fisherman (K.TREAT s) and
   walks back; meanwhile the car waits (held). With the doctor back in it, the car must get off the low road to the dry (s past K.DRY[1]
   forward or before K.DRY[0] back, no water under it): done. The water on the road holds the car back (MisKit.wade), over K.SLIP m it
   floats and the tide carries it sideways (K.SLIDE m/s, inland), at K.DEEP m the engine drowns: failed; the time up: failed. The wrong way
   is allowed (back the way it came). */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js');
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s), dec = (s) => (typeof Lang !== 'undefined' ? Lang.dec(s) : String(s));
  const K = { ISL: 418, OFF: 22, SIDE: -1, R: 7, STOP: 378, ZONE: 8, VSTOP: 1.5, WALK: 14, TREAT: 32, L0: -0.69, RISE: 0.0078, LOW: -0.22, SLIP: 0.35, DEEP: 0.78, SLIDE: 1.4,
    DRY: [350, 740], C: 500, COFF: 0, R0: 140, R1: 190, DROP: 4, WY: -2.7, LIMIT: 200 };
  const sstep = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
  const sOf = (T, P) => { if (!P || !P.q) return 0; const L = T.len, d = (((P.q.s - (T.startS || 0)) % L) + L) % L; return d > L / 2 ? d - L : d; };   // (m from the start line: behind it on the grid < 0)

  // the tide's water: a disc, flat within R0, its rim sinking DROP m by R1 (under the creek's own water and the ground: no edge to see);
  // the creek's own look (the world's water material, its waves on the shared picture) where the world has it
  function tide(r, cx, cz, y) {
    const W = { y, cx, cz, mesh: null, at(x, z) { const d = Math.hypot(x - cx, z - cz); return d >= K.R1 ? -Infinity : W.y - K.DROP * sstep((d - K.R0) / (K.R1 - K.R0)); },
      set(v) { W.y = v; if (W.mesh) W.mesh.position.y = v; } };
    if (typeof THREE === 'undefined') return W;
    const S = 72, RAD = [0, 0.3, 0.6, 0.85, 1].map(f => f * K.R0).concat([1, 2, 3, 4, 5, 6].map(k => K.R0 + (K.R1 - K.R0) * k / 6)), pos = [], uv = [], nor = [], idx = [];
    for (let j = 0; j < RAD.length; j++) for (let k = 0; k < S; k++) {
      const a = k / S * Math.PI * 2, x = Math.cos(a) * RAD[j], z = Math.sin(a) * RAD[j], yy = -K.DROP * sstep((RAD[j] - K.R0) / (K.R1 - K.R0));
      pos.push(x, yy, z); nor.push(0, 1, 0); uv.push((cx + x) / 40, -(cz + z) / 40);
    }
    for (let j = 0; j < RAD.length - 1; j++) for (let k = 0; k < S; k++) { const a = j * S + k, b = j * S + (k + 1) % S, c = a + S, d = b + S; idx.push(a, b, c, b, d, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    const WM = typeof World !== 'undefined' && World.api && World.api.waterMat, TX = typeof Tex !== 'undefined' && Tex.all ? Tex.all() : null;
    const mat = WM && TX ? WM(TX, { color: 0x4d6a5c, len: 1.8, amp: 0.25, refl: 0.28, land: 0.5, shal: 0.4, lap: 0.2, surf: 0 }) : new THREE.MeshPhongMaterial({ color: 0x3f7a7a, shininess: 40 });
    Object.assign(mat, { transparent: true, opacity: 0.74, depthWrite: false });   // (shallow over the road: its lines and the grass show through)
    const m = new THREE.Mesh(g, mat); m.position.set(cx, y, cz); m.receiveShadow = true; m.renderOrder = 1;
    m.userData.misUndo = () => { mat.map = null; };   // (the picture is the world's, shared: not freed with the mission)
    r.add(m); W.mesh = m;
    return W;
  }

  // the island: a sand mound out of the creek, grass on its top, palms, the fisherman's hut; the footbridge on posts from the road's edge
  // (both in the island's frame: x across the road, away from it; one mesh each)
  function island(r, T) {
    if (typeof THREE === 'undefined') return;
    const i = T.idx(K.ISL), nx = T.nx[i], nz = T.nz[i], ry = Math.atan2(-nz * K.SIDE, nx * K.SIDE), top = 0.9, base = K.WY - 0.8;
    const B = KIT.parts(), SAND = 0xd6c08a, GR = 0x6f9a3c, TR = 0x7a5a3a, LF = 0x3f7a2a;
    B.L.push({ g: new THREE.CylinderGeometry(K.R * 0.8, K.R * 1.05, top - base, 22), m: new THREE.Matrix4().makeTranslation(0, (top + base) / 2, 0), c: SAND });
    B.L.push({ g: new THREE.CylinderGeometry(K.R * 0.6, K.R * 0.78, 0.25, 20), m: new THREE.Matrix4().makeTranslation(0.8, top + 0.1, 0.4), c: GR });
    for (const [x, z, h, lean] of [[-3, -3.2, 7, 0.12], [-2, 3.6, 8, -0.1], [3.4, -3, 6.5, 0.15], [4.2, 2.8, 7.5, -0.12], [-4.4, 0.6, 6, 0.08]]) {
      const M = new THREE.Matrix4().makeRotationZ(lean); M.setPosition(x - Math.sin(lean) * h / 2, top + h / 2, z); B.L.push({ g: new THREE.CylinderGeometry(0.16, 0.24, h, 6), m: M, c: TR });
      const tx = x - Math.sin(lean) * h, ty = top + h;
      for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2, L = 2.8, M2 = new THREE.Matrix4().makeRotationY(-a).multiply(new THREE.Matrix4().makeRotationZ(-0.35)); M2.setPosition(tx + Math.cos(a) * L * 0.45, ty - 0.35, z + Math.sin(a) * L * 0.45); B.L.push({ g: new THREE.BoxGeometry(L, 0.08, 0.7), m: M2, c: LF }); }
    }
    B.box(2, top + 1.2, -1.2, 3.2, 2.4, 2.6, 0xe6dcc6); B.box(2 - 1.61, top + 0.9, -1.2, 0.04, 1.6, 0.9, 0x5a4330);
    { const M = new THREE.Matrix4().makeRotationY(Math.PI / 2); M.setPosition(2, top + 2.4, -1.2); B.L.push({ g: KIT.prism(3.2, 3.8, 1.3), m: M, c: 0x9aa3a8 }); }   // (a tin roof)
    B.box(-1.8, top + 0.25, 2.6, 2.6, 0.12, 1.0, 0x8a6a48, 0.5); B.box(-1.8, top + 0.12, 2.6, 2.4, 0.25, 0.8, 0x6a5038, 0.5);   // (his boat, pulled up on the sand)
    const isl = B.mesh(new THREE.MeshLambertMaterial({ vertexColors: true })); isl.castShadow = true; isl.receiveShadow = true;
    const p = KIT.at(T, K.ISL, K.SIDE * K.OFF); isl.position.set(p.x, 0, p.z); isl.rotation.y = ry; r.add(isl);
    // the footbridge: from the road's edge (a step down from the deck) to the island's sand, on posts down into the creek
    const a0 = T.wS(K.ISL) + 0.6, a1 = K.OFF - K.R * 0.85, L = a1 - a0, y0 = T.hy[i] + 0.35, y1 = top + 0.15, F = KIT.parts(), WD = 0x9a7a55, PO = 0x5a4330;
    { const M = new THREE.Matrix4().makeRotationZ(Math.atan2(y1 - y0, L)); M.setPosition(0, (y0 + y1) / 2, 0); F.L.push({ g: new THREE.BoxGeometry(Math.hypot(L, y1 - y0), 0.14, 1.6), m: M, c: WD }); }
    for (let x = -L / 2 + 0.6; x <= L / 2; x += 3.2) { const yd = y0 + (y1 - y0) * (x + L / 2) / L; for (const sd of [-0.75, 0.75]) { F.box(x, (yd + 1.0 + K.WY - 0.5) / 2, sd, 0.16, yd + 1.0 - K.WY + 0.5, 0.16, PO); } }
    for (const sd of [-0.75, 0.75]) { const M = new THREE.Matrix4().makeRotationZ(Math.atan2(y1 - y0, L)); M.setPosition(0, (y0 + y1) / 2 + 0.95, sd); F.L.push({ g: new THREE.BoxGeometry(Math.hypot(L, y1 - y0), 0.07, 0.07), m: M, c: WD }); }
    const fb = F.mesh(new THREE.MeshLambertMaterial({ vertexColors: true })); fb.castShadow = true;
    const pm = KIT.at(T, K.ISL, K.SIDE * (a0 + a1) / 2); fb.position.set(pm.x, 0, pm.z); fb.rotation.y = ry; r.add(fb);
    r.walk = [KIT.at(T, K.ISL, K.SIDE * (a0 - 1.2)), KIT.at(T, K.ISL, K.SIDE * a0), KIT.at(T, K.ISL, K.SIDE * (a1 + 0.5)), KIT.at(T, K.ISL, K.SIDE * (K.OFF - 2))];
    r.walk[0].y = r.walk[1].y = T.hy[i]; r.walk[1].y = y0 + 0.07; r.walk[2].y = r.walk[3].y = top + 0.15;
  }
  // the lifeguard towers by the low road: white posts, a red hut on top (the last shelter); the yellow box painted on the road where the
  // car stops (two bars across the road, two along its edges); one mesh for all
  function towers(r, T) {
    if (typeof THREE === 'undefined') return;
    const B = KIT.parts(), o = KIT.at(T, K.ISL, 0);
    for (const [s, off] of [[372, 14], [560, 13]]) {
      const p = KIT.at(T, s, off), dx = p.x - o.x, dz = p.z - o.z, y0 = K.WY - 0.5, H = 5.2 - y0;
      for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) B.box(dx + x, y0 + H / 2, dz + z, 0.18, H, 0.18, 0xd8dbe0);
      B.box(dx, 5.4, dz, 2.4, 1.4, 2.4, 0xc4301c); B.box(dx, 6.2, dz, 2.9, 0.12, 2.9, 0xe8e2d6); B.box(dx, 4.65, dz, 2.9, 0.1, 2.9, 0xd8dbe0);
    }
    const YL = 0xf2c42c, W = T.wS(K.STOP) - 0.5;
    for (const [ds, off, lx, lz] of [[-K.ZONE, 0, 2 * W, 0.45], [K.ZONE, 0, 2 * W, 0.45], [0, -W + 0.2, 0.3, 2 * K.ZONE], [0, W - 0.2, 0.3, 2 * K.ZONE]]) {
      const p = KIT.at(T, K.STOP + ds, off), i = T.idx(K.STOP + ds);
      B.box(p.x - o.x, T.hy[i] + 0.05, p.z - o.z, lx, 0.02, lz, YL, Math.atan2(-T.nz[i], T.nx[i]));
    }
    const m = B.mesh(new THREE.MeshLambertMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 })); m.castShadow = true; m.position.set(o.x, 0, o.z); r.add(m);
  }

  Missions.add({
    id: '19', title: 'Pred plimo', track: 'townsville', car: 'medved', limit: K.LIMIT, stars: [110, 150], K,
    story: 'Na otočku v rokavu potoka čaka bolan ribič. Plima narašča: kmalu bo morje prekrilo nizko cesto ob prvem ovinku.',
    goal: 'Pripelji zdravnika do brvi na otok in ga odpelji na suho, preden morje zalije cesto.',
    hint: 'Ustavi v rumenem okvirju pred brvjo: zdravnik gre sam na otok.',
    rows: [{ k: 'sea', label: 'MORJE', bar: true, col: '#3d8cff' }, { k: 'isl', label: 'OTOK' }, { k: 'doc', label: 'ZDRAVNIK' }],
    // alone on the closed streets, dry, by day; the doctor's MEDVED 4x4 in white
    opts: () => ({ tt: true, laps: 1, playerColor: 0xf2f4f6, damage: 0 }),
    begin(r) {
      const T = r.race.track, i = T.idx(K.ISL), c = KIT.at(T, K.C, K.COFF);
      r.doc = 'car'; r.dt = 0; r.depth = 0;
      r.cur = [-T.nx[i] * K.SLIDE, -T.nz[i] * K.SLIDE];   // (the tide floods inland, over the road away from the creek)
      r.W = tide(r, c.x, c.z, K.L0); r.lvl = K.L0;
      r.isl = KIT.at(T, K.ISL, K.SIDE * K.OFF); island(r, T); towers(r, T);
      if (!r.walk) r.walk = [0, 0, 0, 0].map((_, k) => KIT.at(T, K.ISL, K.SIDE * [T.wS(K.ISL) - 0.6, T.wS(K.ISL) + 0.6, K.OFF - K.R * 0.85 + 0.5, K.OFF - 2][k]));
      r.box = KIT.at(T, K.STOP, 0);
      r.crowd = KIT.crowd(r, 2); r.tags = KIT.tags(r);
      { const f = KIT.at(T, K.ISL, K.SIDE * (K.OFF - 1)); r.crowd.put(1, f.x - T.tx[i] * 1.8, 0.9, f.z - T.tz[i] * 1.8, Math.atan2(-T.nz[i] * K.SIDE, T.nx[i] * K.SIDE) + Math.PI, 0x2f6f9e); }   // (the fisherman, by his hut)
      this.show(r);
    },
    // the depth of the sea under the car: the tide's surface there over the road
    depthAt(r) { const P = r.P, y = r.W.at(P.x, P.z); return Number.isFinite(y) ? Math.max(0, y - (P.roadY != null ? P.roadY : P.y || 0)) : 0; },
    step(r, dt) {
      const P = r.P, T = r.race.track, s = sOf(T, P), v = Math.hypot(P.vx || 0, P.vz || 0);
      P.wrongT = 0;   // (back the way it came: allowed)
      // the tide rises; on the road it holds the car back, over the wheels' hubs it floats it sideways, then the engine drowns
      r.lvl = K.L0 + K.RISE * r.t; r.W.set(r.lvl);
      r.depth = this.depthAt(r);
      KIT.wade(P, r.depth, dt, { drag: 1.4, deep: K.DEEP, slip: K.SLIP });
      if (r.depth > K.SLIP) { const f = Math.min(1, (r.depth - K.SLIP) / (K.DEEP - K.SLIP)); P.x += r.cur[0] * f * dt; P.z += r.cur[1] * f * dt; P.h += Math.sin(r.t * 1.7) * 0.25 * f * dt; }
      if (r.depth >= K.DEEP) { r.fail(tr('Morje je zalilo avto.')); this.show(r); return; }
      const near = s > K.STOP - K.ZONE && s < K.ISL + 4;   // (in the yellow box, or on up to the footbridge)
      // at the footbridge: the doctor walks to the island, treats the fisherman, walks back (the car waits)
      if (r.doc === 'car' && near && v < K.VSTOP) { r.doc = 'out'; r.dt = 0; }
      if (r.doc === 'out' || r.doc === 'treat' || r.doc === 'in') {
        KIT.hold(P); P.stuckT = 0; r.dt += dt;
        let f = 1;
        if (r.doc === 'out') { f = Math.min(1, r.dt / K.WALK); if (f >= 1) { r.doc = 'treat'; r.dt = 0; } }
        else if (r.doc === 'treat') { if (r.dt >= K.TREAT) { r.doc = 'in'; r.dt = 0; } }
        else { f = 1 - Math.min(1, r.dt / K.WALK); if (f <= 0) { r.doc = 'back'; KIT.hold(P, false); } }
        if (r.doc === 'back') r.crowd.hide(0); else this.walker(r, f);
      }
      // with the doctor back: off the low road onto the dry
      const off = s < K.DRY[0] || s > K.DRY[1];
      if (r.doc === 'back' && off && r.depth <= 0.02) { r.win(); this.show(r); return; }
      const i0 = T.idx(K.DRY[0] - 8), i1 = T.idx(K.DRY[1] + 8);
      r.tags.set(r.doc === 'car' ? [{ x: r.isl.x, y: 5, z: r.isl.z, cls: 'go', html: '<b>' + tr('OTOK') + '</b>' + tr('ribič čaka') }].concat(s < K.STOP - K.ZONE ? [{ x: r.box.x, y: T.hy[T.idx(K.STOP)] + 2, z: r.box.z, cls: 'go', html: '<b>' + tr('USTAVI') + '</b>' }] : [])
        : r.doc === 'back' ? [{ x: T.px[i0], y: T.hy[i0] + 4, z: T.pz[i0], cls: 'go', html: '<b>' + tr('SUHO') + '</b>' }, { x: T.px[i1], y: T.hy[i1] + 4, z: T.pz[i1], cls: 'go', html: '<b>' + tr('SUHO') + '</b>' }] : []);
      r.say(r.doc === 'car' ? (near ? (v < K.VSTOP ? this.hint : 'Ustavi v rumenem okvirju.') : s >= K.ISL + 4 && s < K.DRY[1] + 200 ? 'Brv je za tabo: zapelji vzvratno do rumenega okvirja.' : r.depth > K.SLIP ? 'Ko voda doseže kolesa, avto začne drseti.' : this.hint)
        : r.doc === 'back' ? (r.depth > K.SLIP ? 'Ko voda doseže kolesa, avto začne drseti.' : 'Zdravnik je v avtu: odpelji ga na suho, naprej ali nazaj.')
        : r.doc === 'treat' ? 'Zdravnik oskrbuje ribiča …' : r.doc === 'out' ? 'Zdravnik gre po brvi na otok.' : 'Zdravnik se vrača v avto.');
      this.show(r);
    },
    // the doctor (in white) along his way: from the car's door to the footbridge, over it, to the fisherman (f 0..1)
    walker(r, f) {
      const P = r.P, w = r.walk, pts = [{ x: P.x, y: P.roadY || w[0].y, z: P.z }, w[0], w[1], w[2], w[3]], L = [];
      let tot = 0; for (let k = 1; k < pts.length; k++) { const d = Math.hypot(pts[k].x - pts[k - 1].x, pts[k].z - pts[k - 1].z); L.push(d); tot += d; }
      let d = f * tot, k = 0; while (k < L.length - 1 && d > L[k]) { d -= L[k]; k++; }
      const a = pts[k], b = pts[k + 1], u = L[k] > 0 ? Math.min(1, d / L[k]) : 1;
      r.crowd.put(0, a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u, a.z + (b.z - a.z) * u, Math.atan2(-(b.z - a.z), b.x - a.x) - Math.PI / 2, 0xf4f6f8);
    },
    // round the lap to the finish line: done if the doctor is back in the car
    finish(r) { if (r.doc === 'back') r.win(); else r.fail(tr('Zapeljal si mimo otoka.')); },
    show(r) {
      const s = sOf(r.race.track, r.P), on = r.lvl - K.LOW, pr = (x) => dec(Math.abs(x).toFixed(1)) + ' m';
      r.set('sea', on < 0 ? tr('{0} pod cesto', pr(on)) : tr('{0} na cesti', pr(on)), (r.lvl - K.L0) / (K.LOW + K.DEEP - K.L0), on > K.SLIP ? '#e8452c' : on > 0 ? '#ffb020' : '#3d8cff');
      const d = Math.abs(K.ISL - s);
      r.set('isl', r.doc === 'car' ? (d > 1000 ? dec((d / 1000).toFixed(1)) + ' km' : Math.round(d) + ' m') : r.doc === 'back' ? tr('oskrbljen') : tr('tukaj'));
      r.set('doc', r.doc === 'car' ? tr('v avtu') : r.doc === 'back' ? tr('nazaj v avtu') : r.doc === 'treat' ? tr('oskrba {0} %', Math.round(100 * Math.min(1, r.dt / K.TREAT))) : tr('na brvi'));
    },
  });
})();
