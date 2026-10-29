/* Special mission 37 · Poplava · Bang Saen, Tajska (js/missions.js; the kit: js/missions/kit.js, the water: MisKit.water, wade, skin,
   crowd, tags, button). The monsoon has flooded the town: one plane of muddy water over it (MisKit.water) rises K.RISE m a second from
   K.L0 (the beach road ~2 m under, the low parts of Sai 2 a few decimetres, the hairpin at the foot of the hill dry). The amphibian (the
   MEDVED's physics, its own body of simple bodies, MisKit.skin) starts on the beach road by Turn 1 and goes up the town: on the way K.H
   houses with people on their flat roofs (marked POMOČ!). Stopped by one (within K.NEAR m of it, slower than K.VSTOP), VRZI OBROČ throws
   the ring: it flies to the roof, a person slides down the line into the amphibian (K.SLIDE s); the current pushes the amphibian toward the
   sea, drifted further than K.FAR m the line slips (throw again). Deep water (over K.SWIM m) and it swims: slow (K.VSWIM), the current
   takes it. Everybody aboard to the dry ground at the hairpin (s K.DRY..): when stopped there they step out. All K.N on dry ground: done;
   the time (K.LIMIT: the water up another half metre) up: failed. The wrong way is allowed (back for a house missed). */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js');
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s), dec = (s) => (typeof Lang !== 'undefined' ? Lang.dec(s) : String(s));
  // the houses (world-bangsaen.js: the footprints of the town by the road; their roofs' tops): [s, x, z, roof y, people]
  const HOUSES = [[452, 314.3, 257.6, 7.1, 1], [984, 220.6, -124.8, 8.02, 2], [1170, 104.3, -271.1, 7.87, 1], [1268, 44.0, -347.5, 4.89, 1], [1702, -204.1, -704.2, 9.03, 2], [2128, -501.1, -1013.7, 8.95, 1]];
  const K = { S0: 360, L0: 1.55, RISE: 0.05 / 60, LIMIT: 600, NEAR: 26, VSTOP: 1.6, FLY: 1.1, SLIDE: 2.2, FAR: 32, SWIM: 0.9, VSWIM: 3.6, CUR: 0.7, DRY: [2150, 2290], VDRY: 2.5,
    N: HOUSES.reduce((a, h) => a + h[4], 0), H: HOUSES.length };

  // the amphibian: a boat's hull on wheels (orange), a white canopy over its open deck, the lamp on its roof (x forward, y up, z across)
  function amphibian(B) {
    const OR = 0xe2661c, DK = 0x9a3f10, WH = 0xeef0f2, BLK = 0x1b1d21, GRY = 0x9aa1a8;
    B.box(0, 0.95, 0, 4.4, 1.0, 2.1, OR); B.box(2.45, 1.05, 0, 0.7, 0.8, 1.9, OR); B.box(2.95, 1.25, 0, 0.4, 0.5, 1.6, DK);
    B.box(-2.3, 1.0, 0, 0.3, 0.9, 2.0, DK); B.box(0, 1.47, 1.06, 4.6, 0.08, 0.06, 0xf4f4f4); B.box(0, 1.47, -1.06, 4.6, 0.08, 0.06, 0xf4f4f4);
    B.box(0.2, 1.48, 0, 4.2, 0.06, 1.95, 0x5c6168);   // (the deck: seen from the camera above)
    for (const [x, z] of [[1.6, 0.85], [1.6, -0.85], [-1.4, 0.85], [-1.4, -0.85]]) B.box(x, 2.1, z, 0.08, 1.3, 0.08, GRY);
    B.box(0.1, 2.8, 0, 3.4, 0.08, 2.0, WH); B.box(1.75, 2.0, 0, 0.06, 0.7, 1.7, 0x2a3440);
    B.box(0.3, 2.9, 0, 0.35, 0.16, 0.6, 0xffb020);
    for (const x of [1.55, -1.35]) for (const sd of [-1, 1]) B.cyl(x, 0.45, sd * 0.98, 0.45, 0.32, BLK);
    B.box(-0.6, 1.6, 0.7, 0.6, 0.18, 0.6, 0xff7a00); B.box(-1.2, 1.6, -0.6, 0.6, 0.18, 0.6, 0xff7a00);   // (life rings on deck)
  }

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
      r.lvl = K.L0; r.saved = 0; r.aboard = 0; r.act = null; r.depth = 0;
      // the current: toward the sea (the sea side of the beach road at the start line)
      const i0 = T.idx(T.startS); r.cur = [T.nx[i0] * K.CUR, T.nz[i0] * K.CUR];
      r.W = KIT.water(r, { x: 0, z: -400, size: 3600, y: r.lvl, col: 0x6e5a3a, op: 0.9 });
      r.houses = HOUSES.map(([s, x, z, y, n], k) => ({ k, s, x, z, y, n, left: n }));
      r.skin = KIT.skin(r, r.P, amphibian);
      r.crowd = KIT.crowd(r, K.N + 2); r.tags = KIT.tags(r); r.btn = KIT.button(r, 'VRZI OBROČ'); if (r.btn.el) r.btn.el.classList.add('red');
      // the people on the roofs: side by side on the roof's edge toward the road
      let k = 0; r.who = [];
      for (const h of r.houses) for (let j = 0; j < h.n; j++) { const p = { h, k: k++, at: 'roof', x: h.x + (j - (h.n - 1) / 2) * 1.1, z: h.z, y: h.y }; r.who.push(p); r.crowd.put(p.k, p.x, p.y, p.z, 0, [0x2f9e57, 0xd84a3a, 0x3a6fd0, 0xe0b020][p.k % 4]); }
      // the ring: a torus thrown along an arc
      if (typeof THREE !== 'undefined') { const m = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.11, 6, 14), new THREE.MeshLambertMaterial({ color: 0xff6a10 })); m.visible = false; r.ring = m; r.add(m); }
      this.show(r);
    },
    // the house nearest the amphibian that still has people on it, its distance
    near(r) { const P = r.P; let best = null, bd = 1e9; for (const h of r.houses) if (h.left > 0) { const d = Math.hypot(h.x - P.x, h.z - P.z); if (d < bd) { bd = d; best = h; } } return best ? { h: best, d: bd } : null; },
    step(r, dt) {
      const P = r.P, T = r.race.track, s = P.q ? P.q.s : 0, v = Math.hypot(P.vx || 0, P.vz || 0);
      P.wrongT = 0;   // (back for a house missed: no wrong way here)
      // the water rises; its depth where the amphibian is; the current and the swimming
      r.lvl = K.L0 + K.RISE * r.t; r.W.set(r.lvl);
      r.depth = Math.max(0, r.lvl - (P.roadY != null ? P.roadY : P.y || 0));
      KIT.wade(P, r.depth, dt, { drag: 0.9, deep: 3.2, slip: K.SWIM, cur: r.cur });
      if (r.depth > K.SWIM && v > K.VSWIM) { const f = K.VSWIM / v; P.vx *= 1 - (1 - f) * Math.min(1, dt * 3); P.vz *= 1 - (1 - f) * Math.min(1, dt * 3); }
      if (r.skin) r.skin.position.y = Math.max(0, Math.min(3, r.depth - K.SWIM));   // (afloat: the hull rides up, its waterline K.SWIM m up its side)
      // the throw: stopped by a house with people on it
      const N = this.near(r), can = !r.act && N && N.d < K.NEAR && v < K.VSTOP;
      r.btn.show(can || !!r.act);
      if (v < 1.2 && (r.act || (N && N.d < K.NEAR * 1.5) || (s >= K.DRY[0] && s <= K.DRY[1]))) P.stuckT = 0;   // (stopped by a house or on the dry ground on purpose: not stuck)
      if (can && (r.btn.take() || r.autoThrow)) { r.act = { h: N.h, t: 0, p: r.who.find(w => w.h === N.h && w.at === 'roof') }; r.autoThrow = false; }
      if (r.act) {
        const A = r.act, d = Math.hypot(A.h.x - P.x, A.h.z - P.z);
        A.t += dt;
        if (d > K.FAR) { r.act = null; if (r.ring) r.ring.visible = false; r.say('Tok te je odnesel: vrni se k hiši in vrzi znova.'); }
        else if (A.t < K.FLY) { const f = A.t / K.FLY; if (r.ring) { r.ring.visible = true; r.ring.position.set(P.x + (A.h.x - P.x) * f, (P.roadY || 0) + 2.5 + (A.h.y - (P.roadY || 0)) * f + Math.sin(f * Math.PI) * 4, P.z + (A.h.z - P.z) * f); r.ring.rotation.x = A.t * 6; } }
        else {
          const f = Math.min(1, (A.t - K.FLY) / K.SLIDE), p = A.p;
          if (r.ring) r.ring.position.set(p.x + (P.x - p.x) * f, p.y + 1 + ((P.roadY || 0) + 2 - p.y) * f, p.z + (P.z - p.z) * f);
          r.crowd.put(p.k, p.x + (P.x - p.x) * f, p.y + ((P.roadY || 0) + 1.2 - p.y) * f, p.z + (P.z - p.z) * f, 0);
          if (f >= 1) { p.at = 'aboard'; A.h.left--; r.aboard++; r.act = null; if (r.ring) r.ring.visible = false; }
        }
      }
      // the people aboard ride on the deck
      const ch = Math.cos(P.h), sh = Math.sin(P.h), lift = r.skin ? r.skin.position.y : 0; let j = 0;
      for (const p of r.who) if (p.at === 'aboard') { const ax = -0.9 + (j % 3) * 0.9, az = (j < 3 ? 0.45 : -0.45); j++; r.crowd.put(p.k, P.x + ch * ax - sh * az, (P.roadY || 0) + 1.15 + lift, P.z + sh * ax + ch * az, -P.h); }
      // dry ground at the hairpin: stopped there, the people step out
      const dry = s >= K.DRY[0] && s <= K.DRY[1];
      if (dry && r.aboard > 0 && v < K.VDRY) {
        let n = 0; for (const p of r.who) if (p.at === 'aboard') { p.at = 'safe'; const a = n++ * 0.7; r.crowd.put(p.k, P.x + Math.cos(P.h + 1.57) * 6 + Math.cos(a) * 1.5, (P.roadY || 0), P.z + Math.sin(P.h + 1.57) * 6 + Math.sin(a) * 1.5, a); }
        r.saved += r.aboard; r.aboard = 0;
      }
      if (r.saved >= K.N) r.win();
      // the tags over the roofs, the hint
      r.tags.set(r.houses.filter(h => h.left > 0).map(h => ({ x: h.x, y: h.y + 2.6, z: h.z, cls: N && N.h === h && N.d < K.NEAR * 3 ? 'go' : '', html: '<b>' + tr('POMOČ!') + '</b>' + tr(h.left === 1 ? '{0} oseba na strehi' : '{0} osebi na strehi', h.left) })));
      const left = r.houses.reduce((a, h) => a + h.left, 0);
      if (!r.act) r.say(can ? 'Vrzi obroč!' : N && N.d < K.NEAR * 2 ? 'Ustavi ob hiši in vrzi obroč.' : r.aboard > 0 && !left ? 'Odpelji ljudi na suho: do ovinka pod hribom.' : dry && r.aboard ? 'Ustavi: ljudje izstopijo na suho.' : left && s > K.DRY[1] - 60 ? 'Nekaj ljudi še čaka na strehah: vrni se po njih.' : this.hint);
      this.show(r);
    },
    // driven round to the finish line (past the dry ground, a lap on): not done
    finish(r) { if (r.saved < K.N) r.fail(tr('Zapeljal si mimo, ljudje so ostali na strehah.')); else r.win(); },
    show(r) {
      r.set('res', r.saved + ' / ' + K.N + (r.aboard ? ' (+' + r.aboard + ')' : ''));
      r.set('depth', dec(r.depth.toFixed(1)) + ' m', Math.min(1, r.depth / 2));
      r.set('rise', '+5 cm/min', Math.min(1, r.t / K.LIMIT));
    },
  });
})();
