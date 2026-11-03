/* Special mission 30 · Ratrak · Mount Baldy, ZDA (js/missions.js; the kit: js/missions/kit.js). At night half a metre of snow has fallen
   on the road up the canyon; at seven the first skiers come. The snowcat (MisKit.skin over the racing 4x4's physics, its own limiter:
   K.VMAX) starts K.S0 m past the start line and must groom the road up to the finish (by the chairlift) before the time is up. The road
   lies under fresh powder (MisKit.cover); where the snowcat goes it leaves its ribbed trail (MisKit.band): the cells of K.CELL m it passed
   over on the road are groomed (UREJENO). On the steep stretches (the grade over K.STEEP, the next K.LOOK m: it unhooks under K.FLAT) the
   winch hooks itself to a post at the stretch's top (its cable drawn); its tension follows the speed: the drum pays out at K.VD, slower
   is tighter, faster is slack. Slack (under K.SLACK) the snowcat slides back down; too tight (over K.TIGHT) for K.SNAP s the cable snaps:
   failed. Over the finish with K.NEED of the road groomed: done (else failed: go back for what was missed). The town's lights below in
   the valley (one Points draw). */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js');
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s);
  const K = { S0: 4490, VMAX: 32, CELL: 5, BLADE: 2.3, STEEP: 0.115, FLAT: 0.085, LOOK: 40, VD: 20 / 3.6, SLACK: 0.3, TIGHT: 0.95, SNAP: 4, SLIDE: 5, NEED: 0.92 };
  const RED = 0xc4161c, DRED = 0x8e0e12, BLK = 0x1b1d21, GRY = 0x8f979f, GLS = 0x1d2733, WH = 0xeef1f4;

  // the snowcat: tracks, the body and the cab, the blade in front, the tiller at the back (x forward, y up, z to the side)
  function snowcat(B) {
    for (const sd of [-1, 1]) { B.box(-0.1, 0.45, sd * 1.15, 4.2, 0.9, 0.75, BLK); B.box(-0.1, 0.93, sd * 1.15, 4.0, 0.06, 0.78, 0x3a3e44); }
    B.box(-0.1, 1.25, 0, 3.6, 0.7, 2.25, RED);
    B.box(0.7, 2.15, 0, 1.7, 1.1, 2.05, RED); B.box(0.7, 2.74, 0, 1.75, 0.08, 2.1, DRED);
    B.box(1.57, 2.25, 0, 0.04, 0.7, 1.85, GLS); for (const sd of [-1, 1]) B.box(0.75, 2.3, sd * 1.03, 1.4, 0.6, 0.03, GLS);
    B.box(-1.2, 1.75, 0, 1.6, 0.3, 2.0, DRED);
    B.box(2.55, 0.8, 0, 0.25, 1.1, 4.4, 0xa31218); B.box(2.68, 0.3, 0, 0.12, 0.2, 4.4, GRY);
    for (const sd of [-1, 1]) B.box(2.1, 0.95, sd * 0.8, 0.9, 0.18, 0.18, GRY);
    B.box(-2.75, 0.55, 0, 0.9, 0.5, 4.0, GRY); B.box(-3.25, 0.25, 0, 0.12, 0.35, 4.0, BLK); B.box(-2.25, 0.75, 0, 0.5, 0.15, 0.3, GRY);
    B.box(1.62, 1.35, 0.8, 0.05, 0.16, 0.3, WH); B.box(1.62, 1.35, -0.8, 0.05, 0.16, 0.3, WH);
  }
  // the town's lights far below in the valley (south-west of the road): one Points draw, no fog
  function town(r) {
    const T = r.race.track, y0 = T.hy[T.startIdx] - 950, n = 2600, pos = new Float32Array(n * 3);
    let k = 0, q = 7;
    const rnd = () => { q = (q * 16807) % 2147483647; return q / 2147483647; };
    while (k < n) { const x = -24000 + rnd() * 30000, z = 9000 + rnd() * 16000; if (Math.abs(Math.sin(x / 900) * Math.cos(z / 1100)) < 0.25 && rnd() < 0.6) continue; pos.set([x, y0 + rnd() * 30, z], k * 3); k++; }
    const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(G, new THREE.PointsMaterial({ color: 0xffc979, size: 2.2, sizeAttenuation: false, fog: false }));
    pts.frustumCulled = false; r.add(pts);
  }

  Missions.add({
    id: '30', title: 'Ratrak', track: 'baldy', limit: 520, stars: [400, 460], K,
    story: 'Ponoči je zapadlo pol metra snega, ob sedmih zjutraj pa pridejo prvi smučarji.',
    goal: 'Z ratrakom uredi cesto do vrha, preden pridejo smučarji.',
    hint: 'Za ratrakom ostane urejen sneg: ne izpusti nobenega dela ceste.',
    rows: [{ k: 'urejeno', label: 'UREJENO', bar: true, col: '#3fbf6a' }, { k: 'vitel', label: 'VITEL', bar: true }, { k: 'naklon', label: 'NAKLON' }, { k: 'smucarji', label: 'SMUČARJI OB' }],
    // alone on the closed road, in the snow, at night; the snowcat: the racing 4x4's physics, slow (K.VMAX)
    opts: () => ({ tt: true, playerModel: KIT.truckModel('truck', { vLim: K.VMAX, len: 5.0, wid: 3.0 }), playerColor: RED, damage: 0 }),
    // the snowcat starts K.S0 m past the start line
    made(race) {
      const T = race.track, c = race.player; if (!c) return;
      const s = T.startS + K.S0, i = T.idx(s);
      c.place(T.px[i], T.pz[i], T.hd[i]); if (T.hasElev) { c.y = c.py = T.hy[i]; c.roadY = c.y; }
      c.dist = s - T.startS; c.q = T.query(T.px[i], T.pz[i], i, {}); c.sPrev = c.q.s;
      while (c.cp < T.cpS.length && c.dist >= T.cpDist[c.cp]) { c.splits.push(0); c.cp++; }
    },
    begin(r) {
      const T = r.race.track, s0 = T.startS + K.S0, s1 = T.finishS, n = Math.ceil((s1 - s0) / K.CELL);
      r.s0 = s0; r.s1 = s1; r.cells = new Uint8Array(n); r.done = 0; r.ten = 0; r.hook = null; r.redT = 0; r.slipT = 0;
      // the grade of each cell, the next K.LOOK m (the road's own heights)
      r.g = new Float32Array(n);
      for (let k = 0; k < n; k++) { const a = s0 + k * K.CELL; r.g[k] = (T.hy[T.idx(Math.min(s1, a + K.LOOK))] - T.hy[T.idx(a)]) / K.LOOK; }
      if (typeof Render !== 'undefined' && Render.setAtmos) Render.setAtmos({ season: 'winter', tod: 'night' }, true);
      if (typeof THREE !== 'undefined' && typeof document !== 'undefined') {
        KIT.cover(r, T, s0 - 30, s1 + 40, { w: 0.6, lift: 0.05 });
        r.trail = KIT.band(r, 6000, { tex: KIT.snowTex('ribs'), rep: 3, across: 6, order: 1 });
        town(r);
        r.skin = KIT.skin(r, r.P, snowcat);
        if (r.skin) {
          const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 0.35), new THREE.MeshBasicMaterial({ color: 0xffa21a })); lamp.position.set(0.6, 2.9, 0); r.skin.add(lamp); r.lamp = lamp;
          const v = Render.viewOf(r.P); if (v && v.lights && v.lights.length >= 4) { v.lights[0].set(1.65, 1.35, -0.8); v.lights[1].set(1.65, 1.35, 0.8); v.lights[2].set(-3.3, 0.9, -1.4); v.lights[3].set(-3.3, 0.9, 1.4); }
        }
        // the winch's cable and the post it is hooked to
        const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
        r.cable = new THREE.Line(lg, new THREE.LineBasicMaterial({ color: 0xd8dde3 })); r.cable.frustumCulled = false; r.cable.visible = false; r.add(r.cable);
        r.post = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.2, 0.3), new THREE.MeshLambertMaterial({ color: 0xe0a020 })); r.post.visible = false; r.add(r.post);
      }
      this.show(r);
    },
    // the top of the steep stretch that starts at cell k: where it flattens (under K.FLAT), at most 600 m on
    top(r, k) { let j = k; while (j < r.g.length - 1 && r.g[j] > K.FLAT && (j - k) * K.CELL < 600) j++; return r.s0 + j * K.CELL + K.LOOK; },
    step(r, dt) {
      const P = r.P, T = r.race.track, q = P.q; if (!q) return;
      const s = q.s, i = T.idx(s), tx = T.tx[i], tz = T.tz[i], v = (P.vx || 0) * tx + (P.vz || 0) * tz, sp = Math.hypot(P.vx || 0, P.vz || 0);
      P.wrongT = 0;   // (back down the road for a part missed: allowed)
      const k = Math.floor((s - r.s0) / K.CELL), on = Math.abs(q.d) < T.wS(s) + 0.8 && k >= 0 && k < r.cells.length;
      // the grooming: the cell under the tiller, the trail behind
      if (on && sp > 0.5) {
        if (!r.cells[k]) { r.cells[k] = 1; r.done++; }
        const ch = Math.cos(P.h), sh = Math.sin(P.h), bx = P.x - ch * 2.9, bz = P.z - sh * 2.9;
        if (r.trail && (!r.last || Math.hypot(bx - r.last[0], bz - r.last[1]) > 1.5)) { r.trail.add(bx, T.hy[T.idx(s - 2.9 * Math.sign(v || 1))] + 0.09, bz, -sh * K.BLADE, ch * K.BLADE); r.last = [bx, bz]; }
      } else if (r.trail && r.last) { r.trail.cut(); r.last = null; }
      // the winch: hooked on a steep stretch, its tension by the speed up the road
      const g = k >= 0 && k < r.g.length ? r.g[k] : 0;
      if (!r.hook && g >= K.STEEP && k >= 0) { const top = this.top(r, k), j = T.idx(top), sd = T.br[j] >= T.bl[j] ? 1 : -1, off = sd * (T.wS(top) + 1.5); r.hook = { s: top, x: T.px[j] + T.nx[j] * off, z: T.pz[j] + T.nz[j] * off, y: T.hy[j] }; r.ten = 0.6; }
      else if (r.hook && (s > r.hook.s - 5 || (g < K.FLAT && s > r.hook.s - K.LOOK - 10))) { r.hook = null; r.redT = 0; }
      if (r.hook) {
        const want = Math.max(0, Math.min(1.25, 0.62 + 0.9 * (K.VD - v) / K.VD));
        r.ten += (want - r.ten) * Math.min(1, dt * 3);
        if (r.ten < K.SLACK) { P.xgl = Math.max(P.xgl || 0, 0.5); P.vx -= tx * K.SLIDE * dt; P.vz -= tz * K.SLIDE * dt; r.slipT += dt; }   // (slack: the tracks slip, it slides back down)
        if (r.ten > K.TIGHT) { r.redT += dt; if (r.redT > K.SNAP) r.fail(tr('Jeklenica vitla se je strgala.')); } else r.redT = Math.max(0, r.redT - dt);
      } else r.ten = 0;
      r.say(r.hook ? (r.ten < K.SLACK ? 'Vitel je ohlapen: počasneje, sicer ratrak zdrsne.' : r.ten > K.TIGHT ? 'Vitel je prenapet: ne ustavljaj se na strmini.' : 'Na strmini drži vitel napet, sicer ratrak zdrsne.') : this.hint);
      if (r.lamp) r.lamp.visible = (r.t * 1.5) % 1 < 0.5;
      if (r.cable) {
        r.cable.visible = r.post.visible = !!r.hook;
        if (r.hook) { const a = r.cable.geometry.attributes.position; a.setXYZ(0, P.x + Math.cos(P.h) * 1.9, (P.y || T.hy[i]) + 1.0, P.z + Math.sin(P.h) * 1.9); a.setXYZ(1, r.hook.x, r.hook.y + 2.0, r.hook.z); a.needsUpdate = true; r.post.position.set(r.hook.x, r.hook.y + 1.1, r.hook.z); }
      }
      r.grade = g;
      this.show(r);
    },
    finish(r) { const f = r.done / r.cells.length; if (f >= K.NEED) r.win(); else r.fail(tr('Cesta ni dovolj urejena: {0} %.', Math.round(f * 100))); },
    show(r) {
      const f = r.done / r.cells.length;
      r.set('urejeno', Math.round(f * 100) + ' %', f, f >= K.NEED ? '#3fbf6a' : '#4a8cff');
      r.set('vitel', r.hook ? Math.round(Math.min(1, r.ten) * 100) + ' %' : tr('prost'), r.hook ? Math.min(1, r.ten) : 0, r.ten < K.SLACK ? '#ffb020' : r.ten > K.TIGHT ? '#e8452c' : '#3fbf6a');
      r.set('naklon', Math.round(Math.max(0, r.grade || 0) * 100) + ' %', null, (r.grade || 0) >= K.STEEP ? '#ffb020' : null);
      r.set('smucarji', '7:00');
    },
  });
})();
