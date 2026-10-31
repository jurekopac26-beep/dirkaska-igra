/* Special mission 37 · Poplava · Bang Saen, Tajska (js/missions.js; the kit: js/missions/kit.js, the water: MisKit.water, wade, skin,
   crowd, tags, button). The monsoon has flooded the town: one plane of muddy water over it (MisKit.water) rises K.RISE m a second from
   K.L0 (the beach road ~2 m under, the soi and the low parts of Sai 2 about a metre, the hairpin at the foot of the hill dry). The
   amphibian (the MEDVED's physics, its own body of simple bodies, MisKit.skin) starts on the beach road by Turn 1 and goes up the town: on
   the way K.H houses with people on their flat roofs (marked POMOČ!). Stopped by one (within K.NEAR m of the people, slower than K.VSTOP),
   VRZI OBROČ throws the ring: it flies to the roof (K.FLY s), a person slides down the line onto the amphibian's deck (K.SLIDE s); the
   current pushes the amphibian toward the sea, drifted further than K.FAR m the line slips (throw again). Deep water (over K.SWIM m) and
   it swims: slow (K.VSWIM), its hull afloat (its waterline K.WL m up its side), the current takes it. Everybody aboard to the dry ground at
   the hairpin (s K.DRY): stopped there they step out. All K.N on dry ground: done; the time (K.LIMIT: the water up another half metre) up,
   or driven on round to the finish line: failed. The wrong way is allowed (back for a house missed). */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js');
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s), dec = (s) => (typeof Lang !== 'undefined' ? Lang.dec(s) : String(s));
  // the houses (world-bangsaen.js: the town's flat-roofed blocks by the road, checked in the scene by a ray down): [s, x, z, roof y, people];
  // x, z where the people stand: on the roof, a metre in from its edge toward the road (11-17 m from the centre line, behind the barriers)
  const HOUSES = [[452, 311.6, 254.4, 7.1, 1], [984, 223.3, -126.9, 8.02, 2], [1170, 107.6, -273.7, 7.87, 1], [1268, 45.5, -348.8, 4.89, 1],
    [1702, -206.7, -702.1, 9.03, 2], [2128, -498.9, -1016.2, 8.95, 1]];
  const K = { S0: 360, L0: 1.55, RISE: 0.05 / 60, LIMIT: 600, NEAR: 26, VSTOP: 1.6, FLY: 1.1, SLIDE: 2.2, FAR: 32, SWIM: 0.9, WL: 0.8, VSWIM: 4.2, CUR: 0.7,
    DRY: [2150, 2290], VDRY: 2.5, N: HOUSES.reduce((a, h) => a + h[4], 0), H: HOUSES.length };
  const FEET = -0.28;   // (MisKit.crowd's body starts 0.3 m over its point: its feet on the roof, the deck)
  const COLS = [0x2f9e57, 0xd84a3a, 0x3a6fd0, 0xe0b020];

  // the amphibian: a boat's hull on wheels (orange), the cab with its white roof forward, the open deck behind it where the people stand,
  // the lamp on the cab (x forward, y up, z across)
  function amphibian(B) {
    const OR = 0xe2661c, DK = 0x9a3f10, WH = 0xeef0f2, BLK = 0x1b1d21, GRY = 0x9aa1a8;
    B.box(0, 0.95, 0, 4.4, 1.0, 2.1, OR); B.box(2.45, 1.05, 0, 0.7, 0.8, 1.9, OR); B.box(2.95, 1.25, 0, 0.4, 0.5, 1.6, DK);   // (the hull, its bow)
    B.box(-2.3, 1.0, 0, 0.3, 0.9, 2.0, DK); B.box(0, 1.47, 1.06, 4.6, 0.08, 0.06, 0xf4f4f4); B.box(0, 1.47, -1.06, 4.6, 0.08, 0.06, 0xf4f4f4);
    B.box(-0.2, 1.48, 0, 4.2, 0.06, 1.95, 0x5c6168);   // (the deck)
    B.box(1.45, 2.05, 0, 1.5, 1.1, 1.9, WH); B.box(2.21, 2.15, 0, 0.04, 0.6, 1.6, 0x2a3440); B.box(1.5, 2.2, 0.96, 1.0, 0.45, 0.03, 0x2a3440); B.box(1.5, 2.2, -0.96, 1.0, 0.45, 0.03, 0x2a3440);
    B.box(1.45, 2.64, 0, 1.6, 0.08, 2.0, OR); B.box(1.2, 2.76, 0, 0.3, 0.16, 0.6, 0xffb020);   // (the cab's roof, its lamp)
    for (const sd of [-1, 1]) B.box(-1.0, 1.85, sd * 1.0, 2.6, 0.05, 0.05, GRY);   // (the deck's rails)
    for (const x of [-2.2, 0.2]) for (const sd of [-1, 1]) B.box(x, 1.67, sd * 1.0, 0.05, 0.4, 0.05, GRY);
    for (const x of [1.55, -1.35]) for (const sd of [-1, 1]) B.cyl(x, 0.45, sd * 0.98, 0.45, 0.32, BLK);
    for (const sd of [-1, 1]) B.box(0.0, 1.1, sd * 1.07, 0.6, 0.6, 0.06, 0xff7a00);   // (the life rings on its sides)
  }
  // the deck's places for the people aboard: two rows of four behind the cab (the amphibian's own frame)
  const SEAT = (j) => [-1.85 + (j % 4) * 0.68, j < 4 ? 0.48 : -0.48];

  Missions.add({
    id: '37', title: 'Poplava', track: 'bangsaen', limit: K.LIMIT, stars: [330, 450], K, HOUSES,
    story: 'Monsunski dež je poplavil mesto. Voda še narašča, ljudje čakajo na strehah.',
    goal: 'Z dvoživko poberi ljudi s streh in jih odpelji na suho, preden voda naraste še za pol metra.',
    hint: 'Pelji ob hišo, ustavi in vrzi obroč; tok te nosi proti morju.',
    rows: [{ k: 'res', label: 'REŠENI' }, { k: 'depth', label: 'GLOBINA VODE', bar: true, col: '#3d8cff' }, { k: 'rise', label: 'VODA NARAŠČA', bar: true, col: '#e8452c' }],
    // alone on the closed streets, in the rain; the amphibian on the MEDVED's physics (slower)
    opts: () => ({ tt: true, laps: 1, rain: 1, playerModel: KIT.truckModel('medved', { vLim: 70, kw: 220 }), playerColor: 0xe2661c, damage: 0 }),
    // it starts on the beach road before Turn 1
    made(race) {
      const T = race.track, c = race.player; if (!c) return;
      const s = (T.startS + K.S0) % T.len, i = T.idx(s);
      c.place(T.px[i], T.pz[i], T.hd[i]); if (T.hasElev) { c.y = c.py = T.hy[i]; c.roadY = c.y; }
      c.dist = s - T.startS; c.q = T.query(T.px[i], T.pz[i], i, {}); c.sPrev = c.q.s;
      while (c.cp < T.cpS.length && c.dist >= T.cpDist[c.cp]) { c.splits.push(0); c.cp++; }
    },
    begin(r) {
      const T = r.race.track;
      r.lvl = K.L0; r.saved = 0; r.aboard = 0; r.act = null; r.slips = 0;
      r.depth = Math.max(0, r.lvl - (r.P && r.P.roadY != null ? r.P.roadY : 0));
      // the current: toward the sea (the beach side of the beach road at the start line)
      const i0 = T.idx(T.startS); r.cur = [T.nx[i0] * K.CUR, T.nz[i0] * K.CUR];
      r.W = KIT.water(r, { x: 0, z: -400, size: 3600, y: r.lvl, col: 0x6e5a3a, op: 0.9 });
      r.houses = HOUSES.map(([s, x, z, y, n], k) => ({ k, s: (T.startS + s) % T.len, x, z, y, n, left: n }));
      r.skin = KIT.skin(r, r.P, amphibian);
      r.crowd = KIT.crowd(r, K.N); r.tags = KIT.tags(r); r.btn = KIT.button(r, 'VRZI OBROČ'); if (r.btn.el) r.btn.el.classList.add('red');
      // the people on the roofs: side by side along the roof's edge, facing the road
      let k = 0; r.who = [];
      for (const h of r.houses) {
        const i = T.idx(h.s), tx = Math.cos(T.hd[i]), tz = Math.sin(T.hd[i]);
        h.ry = Math.atan2(T.px[i] - h.x, T.pz[i] - h.z);
        for (let j = 0; j < h.n; j++) { const a = (j - (h.n - 1) / 2) * 1.0, p = { h, k: k++, at: 'roof', x: h.x + tx * a, z: h.z + tz * a, y: h.y }; r.who.push(p); r.crowd.put(p.k, p.x, p.y + FEET, p.z, h.ry, COLS[p.k % 4]); }
      }
      // the ring (a torus thrown along an arc) and its line (a thin yellow box stretched from the roof to the amphibian)
      if (typeof THREE !== 'undefined') {
        const mat = new THREE.MeshLambertMaterial({ color: 0xff6a10 });
        const m = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.11, 6, 14), mat); m.visible = false; r.ring = m; r.add(m);
        const lg = new THREE.BoxGeometry(0.07, 0.07, 1); lg.translate(0, 0, 0.5);
        const l = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0xffd34d })); l.visible = false; r.line = l; r.add(l);
      }
      this.show(r);
    },
    // the house nearest the amphibian that still has people on it, its distance (to where they stand)
    near(r) { const P = r.P; let best = null, bd = 1e9; for (const h of r.houses) if (h.left > 0) { const d = Math.hypot(h.x - P.x, h.z - P.z); if (d < bd) { bd = d; best = h; } } return best ? { h: best, d: bd } : null; },
    // the line from (a) to (b): the box stretched between them
    rope(r, a, b) {
      const l = r.line; if (!l) return;
      if (!a) { l.visible = false; return; }
      const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, L = Math.hypot(dx, dy, dz);
      l.visible = L > 0.1; l.position.set(a.x, a.y, a.z); l.scale.set(1, 1, Math.max(0.01, L)); l.lookAt(b.x, b.y, b.z);
    },
    step(r, dt) {
      const P = r.P, T = r.race.track, s = P.q ? P.q.s : 0, v = Math.hypot(P.vx || 0, P.vz || 0), ry = P.roadY != null ? P.roadY : P.y || 0;
      P.wrongT = 0;   // (back for a house missed: no wrong way here)
      // the water rises; its depth where the amphibian is; the current and the swimming
      r.lvl = K.L0 + K.RISE * r.t; r.W.set(r.lvl);
      r.depth = Math.max(0, r.lvl - ry);
      KIT.wade(P, r.depth, dt, { drag: 0.9, deep: 3.2, slip: K.SWIM, cur: r.cur });
      if (r.depth > K.SWIM && v > K.VSWIM) { const f = K.VSWIM / v, e = Math.min(1, dt * 3); P.vx *= 1 - (1 - f) * e; P.vz *= 1 - (1 - f) * e; }
      const lift = Math.max(0, Math.min(3, r.depth - K.WL));   // (afloat: the hull rides up, its waterline K.WL m up its side)
      if (r.skin) r.skin.position.y = lift;
      const deck = { x: P.x, y: ry + lift + 1.6, z: P.z };
      // the throw: stopped by a house with people on it
      const N = this.near(r), can = !r.act && !!N && N.d < K.NEAR && v < K.VSTOP;
      r.btn.show(can);
      const dry = s >= K.DRY[0] && s <= K.DRY[1];
      if (v < 1.2 && (r.act || (N && N.d < K.NEAR * 1.5) || dry)) P.stuckT = 0;   // (stopped by a house or on the dry ground on purpose: not stuck)
      if (can && (r.btn.take() || r.autoThrow)) { r.act = { h: N.h, t: 0, p: r.who.find(w => w.h === N.h && w.at === 'roof') }; r.autoThrow = false; }
      if (r.act) {
        const A = r.act, p = A.p, d = Math.hypot(p.x - P.x, p.z - P.z);
        A.t += dt;
        if (d > K.FAR) {   // (drifted off: the line slips, the person back on the roof)
          r.act = null; r.slips++; if (r.ring) r.ring.visible = false; this.rope(r, null);
          r.crowd.put(p.k, p.x, p.y + FEET, p.z, A.h.ry); r.say('Tok te je odnesel: vrni se k hiši in vrzi znova.'); r.sayT = 3;
        } else if (A.t < K.FLY) {
          const f = A.t / K.FLY, hy = p.y + 1.2;
          if (r.ring) { r.ring.visible = true; r.ring.position.set(deck.x + (p.x - deck.x) * f, deck.y + 1 + (hy - deck.y - 1) * f + Math.sin(f * Math.PI) * 4, deck.z + (p.z - deck.z) * f); r.ring.rotation.set(A.t * 6, A.t * 2, 0); }
          this.rope(r, deck, r.ring ? r.ring.position : deck);
          r.say('Obroč leti …');
        } else {
          const f = Math.min(1, (A.t - K.FLY) / K.SLIDE), top = { x: p.x, y: p.y + 1.4, z: p.z };
          // (hanging on the ring under the line: its feet off the roof at the start, on the deck at the end)
          const px = p.x + (deck.x - p.x) * f, py = top.y + (deck.y - top.y) * f - 1.75 + f * 1.37, pz = p.z + (deck.z - p.z) * f;
          if (r.ring) { r.ring.visible = true; r.ring.position.set(px, py + 1.6, pz); r.ring.rotation.set(Math.PI / 2, 0, 0); }
          r.crowd.put(p.k, px, py, pz, A.h.ry);
          this.rope(r, top, deck);
          r.say('Oseba se spušča po vrvi …');
          if (f >= 1) { p.at = 'aboard'; A.h.left--; r.aboard++; r.act = null; if (r.ring) r.ring.visible = false; this.rope(r, null); }
        }
      }
      // the people aboard ride on the deck
      const ch = Math.cos(P.h), sh = Math.sin(P.h); let j = 0;
      for (const p of r.who) if (p.at === 'aboard') { const [ax, az] = SEAT(j++); r.crowd.put(p.k, P.x + ch * ax - sh * az, deck.y - 0.1 + FEET, P.z + sh * ax + ch * az, Math.PI / 2 - P.h); }
      // dry ground at the hairpin: stopped there, the people step out (beside the amphibian, toward the nearer kerb, in a little group)
      if (dry && r.aboard > 0 && v < K.VDRY) {
        const i = T.idx(s), nx = T.nx[i], nz = T.nz[i], lat = (P.x - T.px[i]) * nx + (P.z - T.pz[i]) * nz, at = Math.max(-4, Math.min(4, lat + (lat >= 0 ? 3 : -3)));
        for (const p of r.who) if (p.at === 'aboard') { p.at = 'safe'; const a = r.saved * 0.8; r.crowd.put(p.k, T.px[i] + nx * at + Math.cos(a) * 1.3, T.hy[i] + FEET + 0.05, T.pz[i] + nz * at + Math.sin(a) * 1.3, a); r.saved++; }
        r.aboard = 0; r.say('Ljudje so na suhem.'); r.sayT = 2.5;
      }
      if (r.saved >= K.N) r.win();
      // the tags over the roofs
      r.tags.set(r.houses.filter(h => h.left > 0).map(h => ({ x: h.x, y: h.y + 2.5, z: h.z, cls: N && N.h === h && N.d < K.NEAR * 2 ? 'go' : '', html: '<b>' + tr('POMOČ!') + '</b>' + tr(h.left === 1 ? '{0} oseba na strehi' : '{0} osebi na strehi', h.left) })));
      // the hint
      const left = r.houses.reduce((a, h) => a + h.left, 0);
      if (r.sayT > 0) r.sayT -= dt;
      else if (!r.act) r.say(can ? 'Vrzi obroč!' : N && N.d < K.NEAR * 1.6 ? 'Ustavi ob hiši in vrzi obroč.' : dry && r.aboard ? 'Ustavi: ljudje izstopijo na suho.'
        : !left && r.aboard ? 'Odpelji ljudi na suho: do ovinka pod hribom.' : left && s > K.DRY[0] - 15 ? 'Nekaj ljudi še čaka na strehah: vrni se po njih.' : this.hint);
      this.show(r);
    },
    // driven round to the finish line (past the dry ground, a lap on): not done
    finish(r) { if (r.saved < K.N) r.fail(tr('Zapeljal si mimo, ljudje so ostali na strehah.')); else r.win(); },
    show(r) {
      r.set('res', r.saved + ' / ' + K.N + (r.aboard ? ' (+' + r.aboard + ')' : ''));
      r.set('depth', dec(r.depth.toFixed(1)) + ' m', Math.min(1, r.depth / 2.5));
      const cm = Math.min(50, Math.floor(K.RISE * r.t * 100));
      r.set('rise', '+' + cm + ' / 50 cm', Math.min(1, r.t / K.LIMIT));
    },
  });
})();
