/* Special mission 48 · Narasla reka · Longford, Avstralija (js/missions.js; the kit: js/missions/kit.js, the water: MisKit.water, wade,
   skin, crowd, tags, button). After long rain the South Esk rises toward the deck of the first wooden bridge (s K.BR, 1433-1523 m: the
   river under it at s ~1480). On the river flats before the bridge, at the farm (s K.FARM), K.N people wait; the town (s K.TOWN) over the
   bridge is safe. The high rescue truck (the KAMEN's physics, its own body of simple bodies, MisKit.skin) shuttles them: stopped at the
   farm (within K.ZONE m, slower than K.VSTOP) they climb onto its back one by one (K.BOARD s each, K.CAP at most; ODPELJI leaves with
   fewer), the truck turns round by itself if it came from the town (the crew's help: Car.place each step, its heading swung over K.TURN s)
   and goes over the bridge; stopped at the gathering place in the town they climb down (K.DROP s each), it turns round again. The wrong
   way is allowed (back to the farm: no NAPAČNA SMER, no Na progo on the road). The river rises K.RISE m a second from K.L0 (VODA DO MOSTU:
   the deck above it; the flats flood, the truck wades); logs drift down it and, with the water close to the deck (K.HITGAP), hit the
   bridge's piles: each takes K.HITDMG s of its life and shakes the truck on it; over the bridge faster than K.VBR with people on the back
   it shakes and takes K.SPDMG s a second per person. MOST ZDRŽI: the bridge's life (the time to the water on its deck, less the damage).
   Everybody in the town: done; the bridge gone with people left: failed. The race's spectators are hidden (an evacuation, not a race). */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js');
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s);
  const K = { S0: 1100, FARM: 1300, TOWN: 1880, BR: [1433, 1523], RIV: 1480, ZONE: 22, VSTOP: 1.5, N: 9, CAP: 4, BOARD: 1.6, DROP: 0.8, TURN: 2.2,
    DECK: -27.33, L0: -29.4, RISE: 2.07 / 520, VBR: 20 / 3.6, SPDMG: 0.5, HITGAP: 1.0, HITDMG: 6, LOGS: 7, LOGV: 2.4, LOGR: [-170, 110], HOUSE: [38, 21] };

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
  const COLS = [0xd84a3a, 0x3a6fd0, 0x2f9e57, 0xe0b020, 0x8a4fc0, 0xe8e2d4, 0x2a6f7a, 0xc0662a, 0x5a6b8a];
  // the places on the flatbed (the truck's own frame: x forward, z across), the riders facing out
  const SEATS = [[-1.2, 0.55], [-1.2, -0.55], [-2.3, 0.55], [-2.3, -0.55], [-0.2, 0.55], [-0.2, -0.55]];

  Missions.add({
    id: '48', title: 'Narasla reka', track: 'longford', limit: 0, stars: [300, 380], K,   // (no clock of its own: MOST ZDRŽI is the time left)
    story: 'Po dolgem deževju reka hitro narašča. Na kmetiji pred lesenim mostom čaka devet ljudi.',
    goal: 'Prepelji vse s kmetije čez lesen most v mesto, preden ga voda zalije.',
    hint: 'Čez most pelji počasi in po sredini; plavje udarja ob opornice.',
    rows: [{ k: 'gap', label: 'VODA DO MOSTU', bar: true, col: '#e8452c' }, { k: 'evak', label: 'EVAKUIRANI' }, { k: 'most', label: 'MOST ZDRŽI' }, { k: 'plavje', label: 'PLAVJE' }],
    // alone on the closed road, in the rain; the truck on the KAMEN's physics (slower)
    opts: () => ({ tt: true, laps: 1, rain: 1, playerModel: KIT.truckModel('kamen', { vLim: 80, kw: 420 }), playerColor: 0xf08a1c, damage: 0 }),
    // it starts on the hill down to the river flats, K.FARM - K.S0 m before the farm
    made(race) {
      const T = race.track, c = race.player; if (!c) return;
      const s = (T.startS + K.S0) % T.len, i = T.idx(s);
      c.place(T.px[i], T.pz[i], T.hd[i]); if (T.hasElev) { c.y = c.py = T.hy[i]; c.roadY = c.y; }
      c.dist = s - T.startS; c.q = T.query(T.px[i], T.pz[i], i, {}); c.sPrev = c.q.s;
      while (c.cp < T.cpS.length && c.dist >= T.cpDist[c.cp]) { c.splits.push(0); c.cp++; }
    },
    begin(r) {
      const T = r.race.track;
      r.lvl = K.L0; r.farm = K.N; r.aboard = 0; r.safe = 0; r.dmg = 0; r.stage = 'drive'; r.boardT = 0; r.hitT = 0; r.hits = 0; r.shake = 0; r.turnA = null;
      // the river (the South Esk's centre line, downstream: its list's order, the water level falls along it) and where the road crosses it
      const iR = T.idx(K.RIV), bx = T.px[iR], bz = T.pz[iR], rv = (T.def.rivers || []).find(x => /South Esk/.test(x[0]));
      const pts = rv ? rv[1].map(p => [p[0], p[1]]) : [[bx + T.nx[iR] * 300, bz + T.nz[iR] * 300], [bx - T.nx[iR] * 300, bz - T.nz[iR] * 300]];
      const cum = [0]; for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
      let a0 = 0, bd = 1e18;
      for (let k = 0; k + 1 < pts.length; k++) { const p = pts[k], q = pts[k + 1], dx = q[0] - p[0], dz = q[1] - p[1], l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((bx - p[0]) * dx + (bz - p[1]) * dz) / l2)), d = Math.hypot(p[0] + dx * t - bx, p[1] + dz * t - bz); if (d < bd) { bd = d; a0 = cum[k] + t * (cum[k + 1] - cum[k]); } }
      // a point on the river a along it from the bridge (its tangent with it)
      r.riv = (a) => { const A = Math.max(0, Math.min(cum[cum.length - 1], a0 + a)); let lo = 0, hi = cum.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= A) lo = m; else hi = m; }
        const p = pts[lo], q = pts[hi], l = (cum[hi] - cum[lo]) || 1, t = (A - cum[lo]) / l; return { x: p[0] + (q[0] - p[0]) * t, z: p[1] + (q[1] - p[1]) * t, tx: (q[0] - p[0]) / l, tz: (q[1] - p[1]) / l }; };
      { const f = r.riv(0); r.flow = [f.tx, f.tz]; r.bx = f.x; r.bz = f.z; }
      r.W = KIT.water(r, { x: r.bx, z: r.bz, size: 1500, y: r.lvl, col: 0x6b5638, op: 0.92 });
      this.riverLook(r);
      // the farm (a house on the flats beside the road) and its people at the road's edge; the town's gathering place on the footpath
      const pF = KIT.at(T, K.FARM + K.HOUSE[0], -K.HOUSE[1]), wF = T.wS(K.FARM);   // (on the left: the panel of the gauges covers the right of the view far ahead)
      r.H = KIT.house(r, { x: pF.x, y: pF.y - 0.3, z: pF.z }, { ry: pF.ry, L: 11, W: 8, roof: 0x7c8a92, wall: 0xe8e2d4 });
      r.wait = KIT.at(T, K.FARM, -(wF + 3.2)); r.dropAt = KIT.at(T, K.TOWN, -(T.wS(K.TOWN) + 1.8));
      r.skin = KIT.skin(r, r.P, truck); r.crowd = KIT.crowd(r, K.N); r.ride = KIT.crowd(r, K.CAP); r.tags = KIT.tags(r); r.btn = KIT.button(r, 'ODPELJI');
      if (r.ride.g && r.skin) r.skin.add(r.ride.g);   // (the riders in the truck's own frame: they move with its body)
      r.who = []; for (let k = 0; k < K.N; k++) r.who.push({ k, at: 'farm', seat: -1 });
      this.people(r);
      // the logs: drifting down the river through the bridge (one draw)
      r.logs = []; for (let k = 0; k < K.LOGS; k++) r.logs.push({ d: K.LOGR[0] + (k + 0.3) * (K.LOGR[1] - K.LOGR[0]) / K.LOGS, o: ((k * 37) % 11) - 5, jam: 0, hit: false });
      if (typeof THREE !== 'undefined') { const g = new THREE.CylinderGeometry(0.3, 0.36, 5, 7); g.rotateZ(Math.PI / 2); r.logM = new THREE.InstancedMesh(g, new THREE.MeshLambertMaterial({ color: 0x5a4330 }), K.LOGS); r.logM.frustumCulled = false; r.add(r.logM); r._m = new THREE.Matrix4(); r._q = new THREE.Quaternion(); r._e = new THREE.Euler(); r._v = new THREE.Vector3(); r._s = new THREE.Vector3(1, 1, 1); }
      this.logsDraw(r);
      // the race's spectators hidden while it lasts (an evacuation in the rain, not a race day)
      const W = typeof Render !== 'undefined' && Render.world;
      if (W && W.root && typeof THREE !== 'undefined') { const hid = []; W.root.traverse(o => { if (o.name === 'crowds' && o.visible) { o.visible = false; hid.push(o); } }); const g = new THREE.Group(); g.userData.misUndo = () => { for (const o of hid) o.visible = true; }; r.add(g); }
      this.show(r);
    },
    // the flood drawn as the river itself: the world's own water (its waves and the sky in it, by the world position) on the kit's plane;
    // the kit's material put back before the run frees it (the world's stays the world's)
    riverLook(r) {
      const W = typeof Render !== 'undefined' && Render.world, M = r.W.mesh; if (!W || !W.root || !M) return;
      let wm = null;
      W.root.traverse(o => { if (wm || !o.isMesh || o === M || !o.material || o.material.type !== 'MeshPhongMaterial' || o.material.map || !o.material.onBeforeCompile) return;
        if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox; if (r.bx >= b.min.x && r.bx <= b.max.x && r.bz >= b.min.z && r.bz <= b.max.z && b.max.y < -25 && b.max.x - b.min.x > 400) wm = o.material; });   // (the rivers' surface: one mesh, low, kilometres long)
      if (!wm) return;
      const own = M.material; M.material = wm; M.userData.misUndo = () => { M.material = own; };
    },
    // the logs drawn: on the water, sunk at the ends of their run (no popping in), jammed ones turned across
    logsDraw(r) {
      if (!r.logM) return;
      r.logs.forEach((L, k) => { const p = r.riv(L.d), nx = -p.tz, nz = p.tx, e = Math.min(L.d - K.LOGR[0], K.LOGR[1] - L.d), sink = e < 20 ? (1 - e / 20) * 0.9 : 0;
        r._v.set(p.x + nx * L.o, r.lvl + 0.06 - sink + Math.sin(r.t * 1.3 + k) * 0.04, p.z + nz * L.o);
        r._q.setFromEuler(r._e.set(0, Math.atan2(-p.tz, p.tx) + (L.jam > 0 ? 1.4 : 0.35 * Math.sin(k * 2.1 + r.t * 0.2)), 0)); r._m.compose(r._v, r._q, r._s); r.logM.setMatrixAt(k, r._m); });
      r.logM.instanceMatrix.needsUpdate = true;
    },
    // the people where they are: at the farm in a row by the road, on the truck's back, at the gathering place in the town
    people(r) {
      let f = 0, s = 0;
      for (const p of r.who) {
        const c = COLS[p.k % COLS.length];
        if (p.at === 'farm') { const q = r.wait, o = (f++ - 4) * 1.1; r.crowd.put(p.k, q.x + Math.cos(q.ry) * o, q.y - 0.28, q.z - Math.sin(q.ry) * o, q.ry + Math.PI / 2, c); }
        else if (p.at === 'truck') { r.crowd.hide(p.k); const st = SEATS[p.seat] || SEATS[0]; r.ride.put(p.seat, st[0], 1.22, st[1], st[1] > 0 ? Math.PI / 2 : -Math.PI / 2, c); }
        else { const q = r.dropAt, o = (s++ - 4) * 1.0; r.crowd.put(p.k, q.x + Math.cos(q.ry) * o, q.y - 0.28, q.z - Math.sin(q.ry) * o, q.ry - Math.PI / 2, c); }
      }
      for (let k = 0; k < K.CAP; k++) if (!r.who.some(p => p.at === 'truck' && p.seat === k)) r.ride.hide(k);
    },
    // the truck turned round where it stands (the crew helps it: the road is too narrow), over K.TURN s: its heading swung each step
    // (Car.place, its height and its road kept), toward the bridge (fwd) or back
    turnStart(r, fwd) {
      const P = r.P, T = r.race.track, i = T.idx(P.q ? P.q.s : 0), h1 = T.hd[i] + (fwd ? 0 : Math.PI);
      if (Math.cos(P.h - h1) > 0.3) return false;
      const d = Math.atan2(Math.sin(h1 - P.h), Math.cos(h1 - P.h));
      r.turnA = { h0: P.h, dh: d, t: 0, x: P.x, z: P.z }; r.stage = 'turn';
      return true;
    },
    turnStep(r, dt) {
      const P = r.P, T = r.race.track, A = r.turnA; A.t += dt;
      const u = Math.min(1, A.t / K.TURN), e = u * u * (3 - 2 * u), y = P.y, ry = P.roadY, i = P.q && P.q.i >= 0 ? P.q.i : T.idx(P.q ? P.q.s : 0);
      P.place(A.x, A.z, A.h0 + A.dh * e); P.y = P.py = y; P.roadY = ry; P.q = T.query(P.x, P.z, i, {}); P.sPrev = P.q.s; KIT.hold(P);
      if (u >= 1) { r.turnA = null; r.stage = 'go'; KIT.hold(P, false); }
    },
    step(r, dt) {
      const P = r.P, T = r.race.track, s = P.q ? P.q.s : 0, v = Math.hypot(P.vx || 0, P.vz || 0);
      P.wrongT = 0;   // (back to the farm: no wrong way here)
      if (v < 1.2 && P.q && Math.abs(P.q.d) < T.wS(s) + 2.5) P.stuckT = 0;   // (stopped on the road on purpose: no Na progo; off it the rescue stays)
      // the river rises; on the road where it is under the water, the truck wades
      r.lvl = K.L0 + K.RISE * r.t; r.W.set(r.lvl);
      r.depth = Math.max(0, r.lvl - (P.roadY != null ? P.roadY : P.y || 0));
      KIT.wade(P, r.depth, dt, { drag: 0.5, deep: 2.2, slip: 1.2, cur: [r.flow[0] * 1.2, r.flow[1] * 1.2] });
      const gap = K.DECK - r.lvl, onBr = s >= K.BR[0] && s <= K.BR[1];
      // the logs down the river: at the bridge with the water close to its deck, they jam against its piles
      r.hitT = Math.max(0, r.hitT - dt);
      for (const L of r.logs) {
        if (L.jam > 0) { L.jam -= dt; continue; }
        const d0 = L.d; L.d += K.LOGV * dt;
        if (L.d > K.LOGR[1]) { L.d = K.LOGR[0]; L.hit = false; }
        if (!L.hit && d0 < 0 && L.d >= 0) { L.hit = true; if (gap < K.HITGAP) { L.d = 0; L.jam = 2.5; r.dmg += K.HITDMG; r.hits++; r.hitT = 2.5; if (onBr) { r.shake = 0.6; P.vx *= 0.8; P.vz *= 0.8; } } }
      }
      // over the bridge too fast with people on the back: it shakes and gives
      if (onBr && r.aboard > 0 && v > K.VBR) { r.dmg += K.SPDMG * r.aboard * dt * (v / K.VBR); r.shake = Math.max(r.shake, 0.25); }
      if (r.shake > 0) { if (typeof Render !== 'undefined' && Render.shake) Render.shake(r.shake * 0.5, 'mis'); r.shake = Math.max(0, r.shake - dt); }
      r.life = gap / K.RISE - r.dmg;
      const atF = Math.abs(s - K.FARM) < K.ZONE, atT = Math.abs(s - K.TOWN) < K.ZONE;
      if (r.stage === 'turn') this.turnStep(r, dt);
      // at the farm: stopped, they climb on one by one (ODPELJI: off with fewer); full or nobody left: turned toward the bridge
      else if (atF && r.farm > 0 && r.aboard < K.CAP && v < K.VSTOP && r.stage !== 'go') {
        r.stage = 'load'; KIT.hold(P); r.boardT += dt;
        if (r.boardT >= K.BOARD) { r.boardT = 0; const p = r.who.find(w => w.at === 'farm'); if (p) { p.at = 'truck'; p.seat = r.aboard; r.farm--; r.aboard++; } }
        if (r.aboard >= K.CAP || r.farm === 0 || ((r.btn.take() || r.autoGo) && r.aboard > 0)) { r.autoGo = false; r.boardT = 0; if (!this.turnStart(r, true)) { r.stage = 'go'; KIT.hold(P, false); } }
      }
      // at the gathering place in the town: stopped, they climb down one by one; then it turns back toward the farm (if anybody is left)
      else if (atT && r.aboard > 0 && v < K.VSTOP) {
        r.stage = 'drop'; KIT.hold(P); r.boardT += dt;
        if (r.boardT >= K.DROP) { r.boardT = 0; const p = r.who.filter(w => w.at === 'truck').pop(); if (p) { p.at = 'safe'; p.seat = -1; r.aboard--; r.safe++; } }
        if (r.aboard === 0) { r.boardT = 0; if (r.safe >= K.N || !this.turnStart(r, false)) { r.stage = 'go'; KIT.hold(P, false); } }
      } else if (r.stage === 'load' || r.stage === 'drop') { r.stage = 'drive'; r.boardT = 0; KIT.hold(P, false); }
      if (r.stage === 'go' && !atF && !atT) r.stage = 'drive';
      r.btn.show(r.stage === 'load' && r.aboard > 0);
      this.people(r);
      if (r.safe >= K.N) r.win();
      else if (r.life <= 0) r.fail(tr('Voda je zalila most, ljudje so ostali na drugi strani.'));
      this.logsDraw(r);
      // the tags: the people waiting at the farm, the gathering place
      const tg = [];
      if (r.farm > 0) tg.push({ x: r.wait.x, y: r.wait.y + 3.2, z: r.wait.z, cls: r.aboard === 0 ? 'go' : '', html: '<b>' + tr('ŠE {0} LJUDI', r.farm) + '</b>' + tr('čakajo na kmetiji') });
      if (r.aboard > 0) tg.push({ x: r.dropAt.x, y: r.dropAt.y + 3.2, z: r.dropAt.z, cls: 'go', html: '<b>' + tr('ZBIRNO MESTO') + '</b>' + tr('v mestu') });
      r.tags.set(tg);
      // the hint: where to now (behind the truck: turn round)
      const iS = T.idx(s), dir = Math.cos(P.h) * T.tx[iS] + Math.sin(P.h) * T.tz[iS] >= 0 ? 1 : -1;
      const behind = (to) => (to - s) * dir < -K.ZONE;
      r.say(r.stage === 'turn' ? 'Posadka obrača tovornjak.' : r.stage === 'load' ? (r.aboard > 0 ? 'Ljudje se vkrcavajo: ODPELJI, ko jih je dovolj.' : 'Ljudje se vkrcavajo.') : r.stage === 'drop' ? 'Ljudje izstopajo na zbirnem mestu.'
        : onBr && r.aboard > 0 ? this.hint
        : r.aboard > 0 ? (atT ? 'Ustavi na zbirnem mestu.' : behind(K.TOWN) ? 'Obrni: mesto je za teboj.' : 'Odpelji ljudi čez most v mesto.')
        : r.farm > 0 ? (atF ? 'Ustavi pri kmetiji.' : behind(K.FARM) ? 'Obrni: kmetija je za teboj.' : 'Pelji na kmetijo po ljudi.') : '');
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
