/* Special mission 09 · Krilo vetrnice · Katu-Jaryk, Rusija (js/missions.js; the kit: js/missions/kit.js). A 48 m wind-turbine blade on an
   extendable trailer behind a tractor (the racing truck's physics for the tractor, MisKit.skin; the trailer on its own kinematics,
   MisKit.trailer, drawn with MisKit.tow) down the hairpins from K.S0 m past the start line to K.END. The trailer's rear axle steers (the
   second control: ZADNJA OS, the keys L and D move it and it stays where it was left, MisKit.keys; L and D: the trailer's rear swings that
   way); the blade (from K.B0 m ahead of the hitch to K.TIP m behind it) sweeps far over the edges in the hairpins and must miss the crags
   (K.ROCKS: [s, d, the side to steer the axle], one in each hairpin, K.PINS; each K.R m round, from the ground up past the blade). PROSTOR DO SKALE: the blade's room
   to the nearest crag ahead. A crag hit costs the blade half (KRILO); the second: failed. An escort car leads with its beacons. */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js');
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s);
  const dec = (s) => (typeof Lang !== 'undefined' && Lang.dec ? Lang.dec(s) : String(s).replace('.', ','));
  const K = { S0: 900, END: 2950, HITCH: 1.8, LEN: 18, B0: 3, TIP: 45, DMAX: 0.6, RATE: 1.2, R: 2.0, VMAX: 20, HURT: 0.5, SEE: 120, AHEAD: 40,
    PINS: [1120, 1455, 1885, 2105, 2300, 2685, 2815],
    ROCKS: [[1113, 12.5, -1], [1448, -12.9, 1], [1874, 9.8, -1], [2096, -10.6, 1], [2292, 12.8, -1], [2674, -12.3, 1], [2797, 9.7, -1]] };
  const CAB = 0xd8282a, GLS = 0x1d2733, BLK = 0x1b1d21, GRY = 0x9aa1a8, BLD = 0xf1f3f5, YEL = 0xf2c12e;

  // the tractor (x forward from its centre): a cab-over, the fifth wheel at the back
  function tractor(B) {
    B.box(2.0, 1.85, 0, 2.2, 2.5, 2.5, CAB); B.box(3.11, 2.25, 0, 0.04, 0.9, 2.2, GLS); B.box(1.8, 3.2, 0, 1.6, 0.2, 2.3, 0xb01e1e);
    B.box(-1.4, 0.95, 0, 3.6, 0.3, 1.2, BLK); B.box(-1.8, 1.15, 0, 1.2, 0.15, 1.6, GRY);
    for (const x of [2.0, -1.4, -2.7]) for (const sd of [-1, 1]) B.cyl(x, 0.52, sd * 1.05, 0.52, 0.4, BLK);
    B.box(3.13, 1.0, 0.9, 0.04, 0.22, 0.4, 0xfff4cc); B.box(3.13, 1.0, -0.9, 0.04, 0.22, 0.4, 0xfff4cc);
  }
  // the trailer and the blade (x forward from the hitch): the front dolly, the long spine, the steering bogie at K.LEN; the blade's root
  // (a cylinder) on the front, tapering to its tip at K.TIP m behind the hitch
  function load(B) {
    B.box(-0.6, 1.1, 0, 2.4, 0.4, 2.4, BLK); B.box(-K.LEN / 2, 0.95, 0, K.LEN + 1, 0.25, 0.5, YEL);
    for (const x of [-K.LEN + 1.2, -K.LEN, -K.LEN - 1.2]) for (const sd of [-1, 1]) B.cyl(x, 0.5, sd * 1.0, 0.5, 0.36, BLK);
    B.box(-K.LEN, 1.2, 0, 3.6, 0.3, 2.4, YEL);
    const M = new THREE.Matrix4(); M.makeRotationZ(Math.PI / 2); M.setPosition(-0.5 + K.B0 / 2, 3.2, 0); B.L.push({ g: new THREE.CylinderGeometry(1.4, 1.4, K.B0 + 3, 18), m: M, c: BLD });
    B.box(1.0, 2.0, 0, 0.6, 1.6, 2.2, YEL); B.box(-K.LEN, 2.4, 0, 0.6, 2.2, 1.4, YEL);
    // (the blade: sections of a flattened, tapering box from the root to the tip, its chord widest a third along)
    const n = 14; for (let k = 0; k < n; k++) { const u0 = 1.5 + k * (K.TIP - 1.5) / n, u1 = u0 + (K.TIP - 1.5) / n, f = (k + 0.5) / n, ch = (f < 0.3 ? 2.2 + f * 3 : 3.1 * (1 - (f - 0.3) / 0.75)) + 0.25, th = Math.max(0.2, 1.4 * (1 - f));
      B.box(-(u0 + u1) / 2, 3.2 + f * 0.4, 0, u1 - u0 + 0.02, th, ch, BLD); }
    B.box(-K.TIP + 0.6, 3.6, 0, 1.2, 0.25, 0.4, 0xd8282a);
  }
  // the crags (one mesh): rough rock from the ground up past the blade's height
  function crags(r, T) {
    const B = KIT.parts(), W = (typeof Render !== 'undefined' && Render.world) || {}, base = r.rocks[0];
    const M = new THREE.Matrix4(), S = new THREE.Matrix4();
    for (const c of r.rocks) {
      const g = W.groundH ? W.groundH(c.x, c.z) : NaN, y0 = Math.min(Number.isFinite(g) ? g : c.y, c.y) - 1, top = c.y + 6;
      for (let y = y0, k = 0; y < top; y += 2.6, k++) { const s = (K.R + 0.5) * (1.1 - 0.15 * ((y - y0) / Math.max(1, top - y0))); M.makeRotationY(k * 1.3 + c.s); S.makeScale(s, 1.6, s * 0.9); M.multiply(S); M.setPosition(c.x - base.x, y - base.y, c.z - base.z); B.L.push({ g: new THREE.IcosahedronGeometry(1, 0), m: M.clone(), c: k % 2 ? 0x77706a : 0x8a837b }); }
    }
    const g = new THREE.Group(), m = B.mesh(new THREE.MeshLambertMaterial({ vertexColors: true })); m.castShadow = true; g.add(m); g.position.set(base.x, base.y, base.z);
    return g;
  }

  Missions.add({
    id: '09', title: 'Krilo vetrnice', track: 'katu', limit: 600, stars: [380, 480], K,
    story: '48 m dolgo krilo vetrnice je treba prepeljati čez serpentine. Ovinki so ožji od tovora.',
    goal: 'Z dvema drsnikoma krmiš tovornjak in zadnjo os prikolice. Krilo ne sme zadeti skale.',
    hint: 'Z drugim drsnikom krmiš zadnjo os prikolice.',
    rows: [{ k: 'skala', label: 'PROSTOR DO SKALE' }, { k: 'os', label: 'ZADNJA OS', bar: true, col: '#3fa8e0' }, { k: 'krilo', label: 'KRILO', bar: true }],
    // alone down the pass by day (the road closed, the escort ahead); the tractor: the racing truck's physics, walking pace
    opts: () => ({ tt: true, playerModel: KIT.truckModel('titan', { vLim: K.VMAX, kw: 380, len: 6.4, wid: 2.5, mass: 30000 }), playerColor: CAB, damage: 0 }),
    made(race) {
      const T = race.track, c = race.player; if (!c) return;
      const s = T.startS + K.S0, i = T.idx(s);
      c.place(T.px[i], T.pz[i], T.hd[i]); if (T.hasElev) { c.y = c.py = T.hy[i]; c.roadY = c.y; }
      c.dist = s - T.startS; c.q = T.query(T.px[i], T.pz[i], i, {}); c.sPrev = c.q.s;
      while (c.cp < T.cpS.length && c.dist >= T.cpDist[c.cp]) { c.splits.push(0); c.cp++; }
    },
    begin(r) {
      const T = r.race.track, P = r.P;
      r.tr = KIT.trailer(P, { hitch: K.HITCH, len: K.LEN }); r.axle = 0; r.hp = 1; r.hits = 0; r.near = null; r.sEnd = T.startS + K.END;
      r.rocks = K.ROCKS.map(([s0, d, side]) => { const s = T.startS + s0, i = T.idx(s); return { s, d, side, x: T.px[i] + T.nx[i] * d, z: T.pz[i] + T.nz[i] * d, y: T.hy[i], hit: false }; });
      if (typeof THREE !== 'undefined' && typeof document !== 'undefined') {
        r.skin = KIT.skin(r, P, tractor);
        r.towG = KIT.tow(r, P, r.tr, load);
        r.add(crags(r, T));
        r.front = KIT.pilot(r, T);
        r.tags = KIT.tags(r);
        r.keys = KIT.keys(r, [{ k: 'l', label: 'OS L' }, { k: 'd', label: 'OS D' }]); r.keys.show(true);
      }
      this.show(r);
    },
    // the blade's points (every 1.5 m from its root to its tip) in the world
    blade(r) { const L = []; for (let u = -K.B0; u <= K.TIP; u += 1.5) L.push(r.tr.at(u)); return L; },
    step(r, dt) {
      const P = r.P, T = r.race.track, q = P.q; if (!q) return;
      // the rear axle: held keys move it, it stays where it was left
      if (r.keys) { const a = (r.keys.held('d') ? 1 : 0) - (r.keys.held('l') ? 1 : 0); if (a) r.axle = Math.max(-1, Math.min(1, r.axle + a * K.RATE * dt)); }
      r.tr.step(r.axle * K.DMAX);
      { const [ax, az] = r.tr.at(K.LEN), qa = T.query(ax, az, T.idx(q.s - K.LEN), {}); r.tr.pitch = -Math.atan2(T.hy[T.idx(qa.s)] - T.hy[T.idx(q.s)], K.LEN + K.HITCH); }
      // the crags against the blade
      const pts = this.blade(r); let room = 99, near = null;
      for (const c of r.rocks) {
        if (Math.abs(c.s - q.s) > K.TIP + K.SEE) continue;
        let m = 1e9; for (const [x, z] of pts) { const d = Math.hypot(x - c.x, z - c.z); if (d < m) m = d; }
        const gap = m - K.R;
        if (c.s - q.s > -K.TIP && gap < room) { room = gap; near = c; }
        if (gap < 0 && !c.hit) { c.hit = true; r.hits++; r.hp = Math.max(0, 1 - r.hits * K.HURT); r.hitT = 2; }
      }
      r.room = room; r.near = near;
      if (r.hitT > 0) r.hitT -= dt;
      if (r.hp <= 0.001) { r.fail(tr('Krilo je zadelo skalo.')); this.show(r); return; }
      if (q.s >= r.sEnd) { r.win(); this.show(r); return; }
      if (r.front) r.front.put(q.s + K.AHEAD, 0, 1, r.t);
      if (r.tags) { const L = []; for (const c of r.rocks) if (!c.hit && c.s - q.s > -20 && c.s - q.s < K.SEE + 40) L.push({ x: c.x, y: c.y + 6.5, z: c.z, html: '<b>' + tr('SKALA') + '</b>', cls: c === near && room < 1.5 ? 'go' : '' }); r.tags.set(L); }
      const sideTxt = near ? tr(near.side > 0 ? 'desno' : 'levo') : '';
      r.say(r.hitT > 0 ? 'Krilo je zadelo skalo!' : near && room < 3 ? tr('Skala blizu: zadnjo os obrni {0}.', sideTxt) : near && near.s - q.s < 60 ? tr('Pred ovinkom obrni zadnjo os {0}.', sideTxt) : this.hint);
      this.show(r);
    },
    show(r) {
      r.set('skala', r.room == null || r.room > 50 ? '—' : dec(Math.max(0, r.room).toFixed(1)) + ' m');
      const a = r.axle || 0; r.set('os', a < -0.02 ? 'L ' + Math.round(-a * 100) + ' %' : a > 0.02 ? 'D ' + Math.round(a * 100) + ' %' : '0', (a + 1) / 2);
      r.set('krilo', Math.round(r.hp * 100) + ' %', r.hp, r.hp > 0.6 ? '#3fbf6a' : '#e8452c');
    },
  });
})();
