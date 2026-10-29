/* Special mission 48 · Narasla reka · Longford, Avstralija (js/missions.js; the kit: js/missions/kit.js, the water: MisKit.water, wade,
   skin, crowd, tags, button). After long rain the South Esk rises toward the deck of the first wooden bridge (s K.BR, 1433-1523 m: the
   river under it at s ~1480). On the far bank, at the farm (s K.FARM), K.N people wait; the town (s K.TOWN) over the bridge is safe. The
   high rescue truck (the KAMEN's physics, its own body of simple bodies, MisKit.skin) shuttles them: stopped at the farm (within K.ZONE m,
   slower than K.VSTOP) they climb onto its back one by one (K.BOARD s each, K.CAP at most; ODPELJI leaves with fewer), the truck turns round
   by itself (the crew's help: Car.place, its heading toward the bridge) and goes over the bridge; stopped in the town they climb down, it
   turns round again. The wrong way is allowed (back to the farm). The river rises K.RISE m a second from K.L0 (VODA DO MOSTU: the deck
   above it); logs drift down it and, with the water close to the deck (K.HITGAP), hit the bridge's piles: each takes K.HITDMG s of its
   life and shakes the truck on it; over the bridge faster than K.VBR with people on the back it shakes and takes K.SPDMG s a second per
   person. MOST ZDRŽI: the bridge's life (the time to the water on its deck, less the damage). Everybody in the town: done; the bridge gone
   with people left at the farm: failed. */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js');
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s), dec = (s) => (typeof Lang !== 'undefined' ? Lang.dec(s) : String(s));
  const K = { S0: 1100, FARM: 1300, TOWN: 1900, BR: [1433, 1523], RIV: 1480, ZONE: 22, VSTOP: 1.5, N: 9, CAP: 5, BOARD: 1.4, DECK: -27.33, L0: -29.3, RISE: 1.9 / 470,
    VBR: 20 / 3.6, SPDMG: 0.5, HITGAP: 1.0, HITDMG: 7, LOGS: 7, LOGV: 2.6, LIMIT: 600 };

  // the rescue truck: a high cab-over cab (orange), the flatbed with its railings behind it (x forward, y up, z across)
  function truck(B) {
    const OR = 0xf08a1c, DK = 0xa85a10, BLK = 0x1b1d21, GRY = 0x9aa1a8, GLS = 0x1d2733, WH = 0xeef1f4;
    B.box(0, 1.05, 0, 6.0, 0.4, 2.0, BLK);
    B.box(2.25, 2.05, 0, 1.6, 1.9, 2.4, OR); B.box(3.06, 2.45, 0, 0.04, 0.8, 2.1, GLS); B.box(2.3, 3.04, 0, 1.5, 0.08, 2.3, DK);
    B.box(3.08, 1.35, 0.85, 0.04, 0.2, 0.36, 0xfff4cc); B.box(3.08, 1.35, -0.85, 0.04, 0.2, 0.36, 0xfff4cc); B.box(2.3, 3.16, 0, 0.3, 0.14, 1.2, 0xffb020);
    B.box(-0.95, 1.42, 0, 4.1, 0.16, 2.4, 0x6a5a48);   // (the flatbed's planks)
    for (const sd of [-1, 1]) { B.box(-0.95, 2.0, sd * 1.18, 4.1, 0.08, 0.06, GRY); B.box(-0.95, 1.7, sd * 1.18, 4.1, 0.06, 0.05, GRY); for (const x of [-2.95, -1.6, -0.3, 1.0]) B.box(x, 1.75, sd * 1.18, 0.07, 0.62, 0.07, GRY); }
    B.box(-3.0, 1.75, 0, 0.06, 0.62, 2.36, GRY); B.box(-3.04, 1.2, 0.95, 0.04, 0.18, 0.28, 0xff3a2a); B.box(-3.04, 1.2, -0.95, 0.04, 0.18, 0.28, 0xff3a2a);
    B.box(2.25, 1.55, 1.21, 1.2, 0.12, 0.02, WH); B.box(2.25, 1.55, -1.21, 1.2, 0.12, 0.02, WH);
    for (const x of [2.1, -1.5, -2.6]) for (const sd of [-1, 1]) B.cyl(x, 0.62, sd * 1.02, 0.62, 0.44, BLK);
  }

  Missions.add({
    id: '48', title: 'Narasla reka', track: 'longford', limit: K.LIMIT, stars: [330, 420], K,
    story: 'Po dolgem deževju reka hitro narašča. Na kmetiji na drugem bregu čaka devet ljudi.',
    goal: 'Prepelji vse s kmetije čez lesen most, preden ga voda zalije.',
    hint: 'Čez most pelji počasi in po sredini; plavje udarja ob opornice.',
    rows: [{ k: 'gap', label: 'VODA DO MOSTU', bar: true, col: '#e8452c' }, { k: 'evak', label: 'EVAKUIRANI' }, { k: 'most', label: 'MOST ZDRŽI' }, { k: 'plavje', label: 'PLAVJE' }],
    // alone on the closed road, in the rain; the truck on the KAMEN's physics (slower)
    opts: () => ({ tt: true, laps: 1, rain: 1, playerModel: KIT.truckModel('kamen', { vLim: 80, kw: 420 }), playerColor: 0xf08a1c, damage: 0 }),
    // it starts on the far bank's hill, K.FARM - K.S0 m before the farm
    made(race) {
      const T = race.track, c = race.player; if (!c) return;
      const s = (T.startS + K.S0) % T.len, i = T.idx(s);
      c.place(T.px[i], T.pz[i], T.hd[i]); if (T.hasElev) { c.y = c.py = T.hy[i]; c.roadY = c.y; }
      c.dist = s - T.startS; c.q = T.query(T.px[i], T.pz[i], i, {}); c.sPrev = c.q.s;
      while (c.cp < T.cpS.length && c.dist >= T.cpDist[c.cp]) { c.splits.push(0); c.cp++; }
    },
    begin(r) {
      const T = r.race.track;
      r.lvl = K.L0; r.farm = K.N; r.aboard = 0; r.safe = 0; r.dmg = 0; r.stage = 'drive'; r.boardT = 0; r.hitT = 0; r.hits = 0; r.shake = 0;
      // the river under the bridge: its line (downstream) for the logs
      const iR = T.idx(K.RIV), bx = T.px[iR], bz = T.pz[iR];
      r.flow = [T.tz[iR], -T.tx[iR]]; { const rv = (T.def.rivers || []).find(x => /South Esk/.test(x[0])); if (rv) { const pts = rv[1]; let k0 = 0, bd = 1e9; pts.forEach((p, k) => { const d = Math.hypot(p[0] - bx, p[1] - bz); if (d < bd) { bd = d; k0 = k; } }); const a = pts[Math.min(pts.length - 1, k0 + 1)], b = pts[Math.max(0, k0 - 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; r.flow = [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; } }
      r.bx = bx; r.bz = bz;
      r.W = KIT.water(r, { x: bx, z: bz, size: 1500, y: r.lvl, col: 0x6b5638, op: 0.92 });
      // the farm (a house beside the road on the far bank) and its people at the road; the town's gathering place
      const sideF = 1, pF = KIT.at(T, K.FARM, sideF * 42), wF = T.wS(K.FARM);
      r.H = KIT.house(r, { x: pF.x, y: Math.max(pF.y, pF.ty) - 0.2, z: pF.z }, { ry: pF.ry, L: 11, W: 8, roof: 0x7c8a92, wall: 0xe8e2d4 });
      r.wait = KIT.at(T, K.FARM, sideF * (wF + 3.5)); r.dropAt = KIT.at(T, K.TOWN, -(T.wS(K.TOWN) + 2));
      r.skin = KIT.skin(r, r.P, truck); r.crowd = KIT.crowd(r, K.N); r.tags = KIT.tags(r); r.btn = KIT.button(r, 'ODPELJI');
      r.who = []; for (let k = 0; k < K.N; k++) { const p = { k, at: 'farm' }; r.who.push(p); }
      this.people(r);
      // the logs: drifting down the river through the bridge (one draw)
      r.logs = []; for (let k = 0; k < K.LOGS; k++) r.logs.push({ d: -140 + k * (280 / K.LOGS), o: ((k * 37) % 11) - 5, hit: false });
      if (typeof THREE !== 'undefined') { const g = new THREE.CylinderGeometry(0.3, 0.35, 5, 7); g.rotateZ(Math.PI / 2); r.logM = new THREE.InstancedMesh(g, new THREE.MeshLambertMaterial({ color: 0x5a4330 }), K.LOGS); r.logM.frustumCulled = false; r.add(r.logM); r._m = new THREE.Matrix4(); r._q = new THREE.Quaternion(); r._e = new THREE.Euler(); r._v = new THREE.Vector3(); r._s = new THREE.Vector3(1, 1, 1); }
      this.show(r);
    },
    // the people where they are: at the farm in a row by the road, on the truck's back, in the town
    people(r) {
      const P = r.P, ch = Math.cos(P.h), sh = Math.sin(P.h), cols = [0xd84a3a, 0x3a6fd0, 0x2f9e57, 0xe0b020, 0x8a4fc0];
      let f = 0, a = 0, s = 0;
      for (const p of r.who) {
        const c = cols[p.k % cols.length];
        if (p.at === 'farm') { const q = r.wait, o = (f++ - 4) * 1.1; r.crowd.put(p.k, q.x + Math.cos(q.ry) * o, Math.max(q.y, q.ty), q.z - Math.sin(q.ry) * o, q.ry, c); }
        else if (p.at === 'truck') { const ax = -2.5 + (a % 3) * 1.1, az = a < 3 ? 0.5 : -0.5; a++; r.crowd.put(p.k, P.x + ch * ax - sh * az, (P.roadY || P.y || 0) + 1.5, P.z + sh * ax + ch * az, -P.h, c); }
        else { const q = r.dropAt, o = (s++ - 4) * 1.0; r.crowd.put(p.k, q.x + Math.cos(q.ry) * o, Math.max(q.y, q.ty), q.z - Math.sin(q.ry) * o, q.ry, c); }
      }
    },
    // turn the truck round on the spot (the crew helps it: the road is too narrow), its heading along the road forward (toward the bridge) or back
    turn(r, fwd) {
      const P = r.P, T = r.race.track, i = T.idx(P.q ? P.q.s : 0), h = T.hd[i] + (fwd ? 0 : Math.PI);
      if (Math.cos(P.h - h) > 0.3) return;
      const y = P.y, ry = P.roadY, q = P.q;
      P.place(P.x, P.z, h); P.y = P.py = y; P.roadY = ry; P.q = T.query(P.x, P.z, i, {}); P.sPrev = P.q.s; void q;
      if (typeof Render !== 'undefined' && Render.resetCam) Render.resetCam();
    },
    step(r, dt) {
      const P = r.P, T = r.race.track, s = P.q ? P.q.s : 0, v = Math.hypot(P.vx || 0, P.vz || 0);
      P.wrongT = 0;   // (back to the farm: no wrong way here)
      if (v < 1.2 && (Math.abs(s - K.FARM) < K.ZONE || Math.abs(s - K.TOWN) < K.ZONE)) P.stuckT = 0;   // (stopped to load or unload: not stuck)
      // the river rises; on the road where it is under the water, the truck wades
      r.lvl = K.L0 + K.RISE * r.t; r.W.set(r.lvl);
      KIT.wade(P, r.lvl - (P.roadY != null ? P.roadY : P.y || 0), dt, { drag: 0.8, deep: 1.4, slip: 0.6, cur: [r.flow[0] * 1.2, r.flow[1] * 1.2] });
      const gap = K.DECK - r.lvl, onBr = s >= K.BR[0] && s <= K.BR[1];
      // the logs down the river: under the bridge with the water close to its deck, they hit its piles
      r.hitT = Math.max(0, r.hitT - dt);
      for (const L of r.logs) {
        L.d += K.LOGV * dt; if (L.d > 140) { L.d = -140; L.hit = false; }
        if (!L.hit && L.d >= 0 && Math.abs(L.o) < 8) { L.hit = true; if (gap < K.HITGAP) { r.dmg += K.HITDMG; r.hits++; r.hitT = 2.5; if (onBr) { r.shake = 0.6; P.vx *= 0.8; P.vz *= 0.8; } } }
      }
      // over the bridge too fast with people on the back: it shakes and gives
      if (onBr && r.aboard > 0 && v > K.VBR) { r.dmg += K.SPDMG * r.aboard * dt * (v / K.VBR); r.shake = Math.max(r.shake, 0.25); }
      if (r.shake > 0) { if (typeof Render !== 'undefined' && Render.shake) Render.shake(r.shake * 0.5); r.shake = Math.max(0, r.shake - dt); }
      r.life = gap / K.RISE - r.dmg;
      // at the farm: stopped, they climb on one by one (ODPELJI: off with fewer); full or nobody left: the truck turns toward the bridge
      const atF = Math.abs(s - K.FARM) < K.ZONE, atT = Math.abs(s - K.TOWN) < K.ZONE;
      if (atF && r.farm > 0 && r.aboard < K.CAP && v < K.VSTOP && r.stage !== 'go') {
        r.stage = 'load'; KIT.hold(P); r.boardT += dt;
        if (r.boardT >= K.BOARD) { r.boardT = 0; const p = r.who.find(w => w.at === 'farm'); if (p) { p.at = 'truck'; r.farm--; r.aboard++; } }
        if (r.aboard >= K.CAP || r.farm === 0 || ((r.btn.take() || r.autoGo) && r.aboard > 0)) { r.stage = 'go'; KIT.hold(P, false); this.turn(r, true); r.autoGo = false; }
      } else if (r.stage === 'load') { r.stage = 'drive'; KIT.hold(P, false); }
      if (r.stage === 'go' && !atF) r.stage = 'drive';
      r.btn.show(r.stage === 'load' && r.aboard > 0);
      // in the town: stopped, they climb down; the truck turns back toward the farm (if anybody is left there)
      if (atT && r.aboard > 0 && v < K.VSTOP) {
        for (const p of r.who) if (p.at === 'truck') p.at = 'safe';
        r.safe += r.aboard; r.aboard = 0;
        if (r.safe < K.N) this.turn(r, false);
      }
      this.people(r);
      if (r.safe >= K.N) r.win();
      else if (r.life <= 0) r.fail(tr('Voda je zalila most.'));
      // the logs drawn
      if (r.logM) { const ry = Math.atan2(-r.flow[1], r.flow[0]); r.logs.forEach((L, k) => { r._v.set(r.bx + r.flow[0] * L.d - r.flow[1] * L.o, r.lvl + 0.1, r.bz + r.flow[1] * L.d + r.flow[0] * L.o); r._q.setFromEuler(r._e.set(0, ry + k * 0.4, 0)); r._m.compose(r._v, r._q, r._s); r.logM.setMatrixAt(k, r._m); }); r.logM.instanceMatrix.needsUpdate = true; }
      // the tags: the people waiting at the farm, the town
      const tg = [];
      if (r.farm > 0) tg.push({ x: r.wait.x, y: Math.max(r.wait.y, r.wait.ty) + 3.2, z: r.wait.z, cls: r.aboard === 0 ? 'go' : '', html: '<b>' + tr('ŠE {0} LJUDI', r.farm) + '</b>' + tr('čakajo na kmetiji') });
      if (r.aboard > 0) tg.push({ x: r.dropAt.x, y: Math.max(r.dropAt.y, r.dropAt.ty) + 3.2, z: r.dropAt.z, cls: 'go', html: '<b>' + tr('ZBIRNO MESTO') + '</b>' + tr('v mestu') });
      r.tags.set(tg);
      r.say(r.stage === 'load' ? (r.aboard > 0 ? 'Ljudje se vkrcavajo: ODPELJI, ko jih je dovolj.' : 'Ljudje se vkrcavajo.') : onBr && r.aboard > 0 ? 'Čez most pelji počasi in po sredini; plavje udarja ob opornice.' : r.aboard > 0 ? 'Odpelji ljudi čez most v mesto.' : r.farm > 0 ? (s > K.TOWN + K.ZONE ? 'Obrni in se vrni po ljudi na kmetijo.' : 'Pelji na kmetijo po ljudi.') : this.hint);
      this.show(r);
    },
    // over the finish line (a lap on): not done
    finish(r) { if (r.safe < K.N) r.fail(tr('Zapeljal si mimo, ljudje so ostali na kmetiji.')); else r.win(); },
    show(r) {
      const gap = K.DECK - r.lvl, life = r.life != null ? r.life : gap / K.RISE;
      r.set('gap', Math.max(0, Math.round(gap * 100)) + ' cm', 1 - Math.max(0, Math.min(1, gap / (K.DECK - K.L0))));
      r.set('evak', r.safe + ' / ' + K.N + (r.aboard ? ' (+' + r.aboard + ')' : ''));
      r.set('most', tr('še {0}', Missions.clock(Math.max(0, life))));
      r.set('plavje', tr(gap >= K.HITGAP ? 'pod mostom' : r.hitT > 0 ? 'udarja ob most' : 'ob opornicah'));
    },
  });
})();
