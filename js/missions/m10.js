/* Special mission 10 · Pobegla čreda · Harju, Finska (js/missions.js; the kit: js/missions/kit.js, MisKit.skin, herd, rails, tags). Nine
   cows have got out of the farm onto the path through the park on the ridge (from K.C0 m past the start line); the farmer's pickup
   (MisKit.skin over the off-roader's physics, its own limiter) starts behind them (K.S0) and drives them along the path to their pen beside
   it (K.PEN m: a fence of rails on the path's right with a gate at the path's edge). The cows in the path's frame (s along, d across):
   they walk on away from the pickup when it follows them (within K.PUSH m: along the path, back toward its middle), shy from it close
   (K.FLEE m), keep together and apart; left alone (the pickup over K.PUSH m away) they wander off toward the trees on either side; a cow
   K.WOOD m past the path's wall is gone into the forest. The pickup too fast near them (over K.VFAST m/s within K.SCAT m) scatters them
   sideways. Near the gate the cows smell the hay and go in (within K.LURE m of it they walk to it at K.HAY m/s, the pickup's push weaker). All the cows not lost in the pen: done; more than K.LOSE lost:
   failed. */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js');
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s);
  const K = { N: 9, S0: 1868, C0: 1900, C1: 1948, PEN: 2140, PL: 12, PD: 13, GATE: 5, VMAX: 60, FLEE: 13, PUSH: 40, SCAT: 18, VFAST: 7,
    WOOD: 5, LURE: 22, HAY: 1.6, WALK: 1.2, RUN: 3.5, BOLT: 4.5, DRIFT: 0.28, LOSE: 2 };
  const GRN = 0x2a5a3a, BLK = 0x1b1d21, GLS = 0x1d2733;
  // a seeded random (the same herd every run)
  const rnd = (seed) => { let x = seed >>> 0; return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; }; };

  // the pickup: the cab, the open bed with its sides, the wheels (x forward, y up, z to the side)
  function pickup(B) {
    B.box(1.25, 0.9, 0, 2.3, 0.8, 1.9, GRN); B.box(0.35, 1.55, 0, 1.6, 0.75, 1.82, GRN); B.box(1.16, 1.55, 0, 0.04, 0.6, 1.66, GLS);
    B.box(-0.46, 1.55, 0, 0.04, 0.5, 1.6, GLS); for (const sd of [-1, 1]) B.box(0.35, 1.58, sd * 0.92, 1.4, 0.45, 0.02, GLS);
    B.box(-1.4, 0.62, 0, 2.6, 0.12, 1.86, 0x22262b); for (const sd of [-1, 1]) B.box(-1.4, 0.95, sd * 0.9, 2.6, 0.55, 0.08, GRN);
    B.box(-2.68, 0.95, 0, 0.08, 0.55, 1.86, GRN); B.box(-2.73, 0.95, 0.7, 0.04, 0.16, 0.22, 0xff3a2a); B.box(-2.73, 0.95, -0.7, 0.04, 0.16, 0.22, 0xff3a2a);
    B.box(2.41, 0.95, 0.65, 0.04, 0.16, 0.3, 0xfff4cc); B.box(2.41, 0.95, -0.65, 0.04, 0.16, 0.3, 0xfff4cc);
    B.box(-1.2, 0.85, 0, 0.9, 0.5, 0.9, 0xc8a24a);   // (a bale of hay on the bed)
    for (const x of [1.5, -1.6]) for (const sd of [-1, 1]) B.cyl(x, 0.4, sd * 0.86, 0.4, 0.28, BLK);
  }

  Missions.add({
    id: '10', title: 'Pobegla čreda', track: 'harju', limit: 300, stars: [180, 235], K,
    story: 'S kmetije je pobegnilo devet krav. Razkropile so se po poti skozi park.',
    goal: 'S poltovornjakom zaženi pobegle krave nazaj v ogrado.',
    hint: 'Prehitro jih razpršiš, prepočasi pobegnejo v gozd.',
    rows: [{ k: 'pen', label: 'V OGRADI', bar: true, col: '#3fbf6a' }, { k: 'lost', label: 'V GOZDU' }, { k: 'gate', label: 'DO OGRADE' }],
    // alone on the closed path, dry, by day; the pickup on the off-roader's physics, slow, no damage
    opts: () => ({ tt: true, laps: 1, playerModel: KIT.truckModel('medved', { vLim: K.VMAX, len: 5.0 }), playerColor: GRN, damage: 0 }),
    made(race) {
      const T = race.track, c = race.player; if (!c) return;
      const s = T.startS + K.S0, i = T.idx(s);
      c.place(T.px[i], T.pz[i], T.hd[i]); if (T.hasElev) { c.y = c.py = T.hy[i]; c.roadY = c.y; }
      c.dist = s - T.startS; c.q = T.query(T.px[i], T.pz[i], i, {}); c.sPrev = c.q.s;
      while (c.cp < T.cpS.length && c.dist >= T.cpDist[c.cp]) { c.splits.push(0); c.cp++; }
    },
    begin(r) {
      const T = r.race.track, R = rnd(10);
      r.gs = T.startS + K.PEN;
      const wall = (s, sd) => { const i = T.idx(s); return sd > 0 ? T.br[i] : T.bl[i]; };
      r.wall = wall; r.pin = 0; r.lost = 0;
      r.cows = []; for (let k = 0; k < K.N; k++) { const s = T.startS + K.C0 + (K.C1 - K.C0) * (k + R() * 0.8) / K.N, sd = R() < 0.5 ? -1 : 1; r.cows.push({ s, d: sd * R() * (wall(s, sd) + 1.5), vs: 0, vd: 0, st: 'free', ry: R() * 6.28, ph: R() * 6, scT: 0, sc: 0 }); }
      r.pen = { s0: r.gs - K.PL, s1: r.gs + K.PL };
      if (typeof Render !== 'undefined' && Render.setAtmos) Render.setAtmos({ season: 'summer', tod: 'day' }, true);
      if (typeof THREE !== 'undefined' && typeof document !== 'undefined') {
        r.skin = KIT.skin(r, r.P, pickup);
        if (r.skin) { const v = Render.viewOf(r.P); if (v && v.lights && v.lights.length >= 4) { v.lights[0].set(2.43, 0.95, -0.65); v.lights[1].set(2.43, 0.95, 0.65); v.lights[2].set(-2.75, 0.95, -0.7); v.lights[3].set(-2.75, 0.95, 0.7); } }
        r.herd = KIT.herd(r, 'cow', K.N);
        // the pen on the path's right: its side along the path with the gate in it, the far side and the two ends
        const B = KIT.parts(), w0 = T.wS(r.gs) + 0.4, P = (s, d) => { const i = T.idx(s); return [T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d]; }, y0 = T.hy[T.idx(r.gs)] - 0.05;
        const line = (s0, d0, s1, d1) => { const n = Math.max(1, Math.round(Math.abs(s1 - s0) / 4)); for (let k = 0; k < n; k++) { const a = P(s0 + (s1 - s0) * k / n, d0 + (d1 - d0) * k / n), b = P(s0 + (s1 - s0) * (k + 1) / n, d0 + (d1 - d0) * (k + 1) / n); KIT.rails(B, a[0] - P(r.gs, 0)[0], a[1] - P(r.gs, 0)[1], b[0] - P(r.gs, 0)[0], b[1] - P(r.gs, 0)[1], 0, { every: 2.2 }); } };
        line(r.pen.s0, w0, r.gs - K.GATE, w0); line(r.gs + K.GATE, w0, r.pen.s1, w0);
        line(r.pen.s0, w0, r.pen.s0, w0 + K.PD); line(r.pen.s1, w0, r.pen.s1, w0 + K.PD); line(r.pen.s0, w0 + K.PD, r.pen.s1, w0 + K.PD);
        { const a = P(r.gs, 0); for (const sg of [-1, 1]) { const g = P(r.gs + sg * K.GATE, w0); B.box(g[0] - a[0], 0.8, g[1] - a[1], 0.26, 1.6, 0.26, 0x3a2a1a); }
          const h = P(r.gs, w0 + K.PD * 0.6); B.box(h[0] - a[0], 0.5, h[1] - a[1], 1.4, 1.0, 1.4, 0xc8a24a); B.box(h[0] - a[0] + 1.8, 0.5, h[1] - a[1] - 1.0, 1.4, 1.0, 1.4, 0xd2ae52); }
        const m = B.mesh(new THREE.MeshLambertMaterial({ vertexColors: true })); m.castShadow = true; const o = P(r.gs, 0); m.position.set(o[0], y0, o[1]); r.add(m); r.penMesh = m;
        r.tags = KIT.tags(r); r.w0 = w0;
      }
      r.w0 = r.w0 || T.wS(r.gs) + 0.4;
      this.draw(r); this.show(r);
    },
    // the player in the path's frame
    me(r) { const P = r.P, T = r.race.track, s = P.q ? P.q.s : 0, i = T.idx(s); return { s, d: (P.x - T.px[i]) * T.nx[i] + (P.z - T.pz[i]) * T.nz[i] }; },
    step(r, dt) {
      const P = r.P, T = r.race.track, me = this.me(r), v = Math.hypot(P.vx || 0, P.vz || 0), free = r.cows.filter(c => c.st === 'free');
      P.wrongT = 0; P.stuckT = 0;
      let ms = 0, md = 0; for (const c of free) { ms += c.s; md += c.d; } if (free.length) { ms /= free.length; md /= free.length; }
      let scat = false;
      for (const c of r.cows) {
        if (c.st === 'lost') continue;
        if (c.st === 'pen') { c.ph += dt * 0.5; c.ry += Math.sin(c.ph * 0.7) * dt * 0.2; continue; }
        const ds = c.s - me.s, dd = c.d - me.d, dist = Math.hypot(ds, dd) || 0.01;
        let ws = 0, wd = 0;
        if (v > K.VFAST && dist < K.SCAT && c.scT <= 0) { c.scT = 2.2; c.sc = dd !== 0 ? Math.sign(dd) : (c.d >= 0 ? 1 : -1); scat = true; }
        if (c.scT > 0) { c.scT -= dt; ws += Math.sign(ds || 1) * K.BOLT * 0.35; wd += c.sc * K.BOLT; }
        else if (dist < K.FLEE) { const f = K.RUN * (1 - dist / K.FLEE) + K.WALK; ws += ds / dist * f; wd += dd / dist * f * 0.4; wd += -c.d * 0.2; }
        else if (dist < K.PUSH) { ws += Math.sign(ds || 1) * K.WALK; wd += -c.d * 0.15; }
        else wd += (c.d >= 0 ? 1 : -1) * K.DRIFT;
        // the herd: together (toward its middle), apart (not on each other)
        if (free.length > 1) { ws += (ms - c.s) * 0.04; if (dist < K.PUSH) wd += (md - c.d) * 0.04; }   // (left alone they spread out across)
        for (const o of free) { if (o === c) continue; const es = c.s - o.s, ed = c.d - o.d, e = Math.hypot(es, ed); if (e < 2.4 && e > 0.01) { ws += es / e * (2.4 - e); wd += ed / e * (2.4 - e); } }
        // the hay at the pen: near the gate they go in
        const gd = c.s - r.gs;
        if (Math.abs(gd) < K.LURE && c.scT <= 0) { const e = Math.hypot(gd, r.w0 + 2 - c.d) || 1, f = K.HAY * Math.min(1, e / 3); ws = ws * 0.3 - gd / e * f; wd = wd * 0.3 + (r.w0 + 2 - c.d) / e * f; }
        const sp = Math.hypot(ws, wd), cap = c.scT > 0 ? K.BOLT : K.RUN + K.WALK;
        if (sp > cap) { ws *= cap / sp; wd *= cap / sp; }
        c.vs += (ws - c.vs) * Math.min(1, dt * 3); c.vd += (wd - c.vd) * Math.min(1, dt * 3);
        const ns = c.s + c.vs * dt; let nd = c.d + c.vd * dt;
        // the pen's fence: only through the gate
        const inS = ns > r.pen.s0 && ns < r.pen.s1, gate = Math.abs(ns - r.gs) < K.GATE - 0.6;
        if (inS && nd > r.w0 - 0.6 && c.d <= r.w0 - 0.6 && !gate) nd = r.w0 - 0.6;
        if (inS && nd > r.w0 + 0.5 && (gate || c.d > r.w0 - 0.6)) { c.st = 'pen'; r.pin++; c.d = r.w0 + 2 + Math.random() * (K.PD - 4); c.s = r.gs + (Math.random() - 0.5) * (2 * K.PL - 4); continue; }
        c.s = ns; c.d = nd;
        const sp2 = Math.hypot(c.vs, c.vd); if (sp2 > 0.2) { c.ph += dt * sp2 * 2.2; const i = T.idx(c.s), a = Math.atan2(T.tz[i], T.tx[i]), dir = Math.atan2(c.vd, c.vs); c.ry = -(a + dir); }
        if (Math.abs(c.d) > r.wall(c.s, c.d) + K.WOOD) { c.st = 'lost'; r.lost++; if (r.herd) r.herd.hide(r.cows.indexOf(c)); }
      }
      if (scat) r.scatT = 3; else if (r.scatT > 0) r.scatT -= dt;
      this.draw(r);
      const left = r.cows.filter(c => c.st === 'free').length;
      if (r.lost > K.LOSE) { this.show(r); r.fail(tr('Preveč krav je pobegnilo v gozd.')); return; }
      if (!left) { this.show(r); r.win(); return; }
      const far = free.filter(c => Math.hypot(c.s - me.s, c.d - me.d) > K.PUSH).length;
      r.say(r.scatT > 0 ? 'Prehitro! Krave so se razbežale.' : far ? 'Krave se razhajajo proti gozdu: zapelji bliže.' : ms - me.s < 0 ? 'Zapelji za čredo in jo počasi potiskaj naprej.' : this.hint);
      if (r.tags) { const L = [], i = T.idx(r.gs), sd = r.w0 + K.PD / 2; if (Math.abs(r.gs - me.s) < 300) L.push({ x: T.px[i] + T.nx[i] * sd, y: T.hy[i] + 4, z: T.pz[i] + T.nz[i] * sd, html: '<b>' + tr('OGRADA') + '</b>' + tr('{0} / {1}', r.pin, K.N), cls: 'go' });
        for (const c of free) if (Math.abs(c.d) > r.wall(c.s, c.d) + 1) { const j = T.idx(c.s); L.push({ x: T.px[j] + T.nx[j] * c.d, y: T.hy[j] + 2.6, z: T.pz[j] + T.nz[j] * c.d, html: '<b>' + tr('BEŽI!') + '</b>', cls: '' }); }
        r.tags.set(L); }
      r.me = me; this.show(r);
    },
    draw(r) {
      if (!r.herd) return;
      const T = r.race.track, W = typeof Render !== 'undefined' && Render.world;
      r.cows.forEach((c, k) => { if (c.st === 'lost') return; const i = T.idx(c.s), x = T.px[i] + T.nx[i] * c.d, z = T.pz[i] + T.nz[i] * c.d, gh = W && W.groundH ? W.groundH(x, z) : NaN, y = Math.abs(c.d) <= T.wS(c.s) + 0.3 || !Number.isFinite(gh) ? T.hy[i] : gh; r.herd.put(k, x, y, z, c.ry, 1, c.st === 'free' ? c.ph : 0); });
    },
    show(r) {
      r.set('pen', tr('{0} / {1}', r.pin || 0, K.N), (r.pin || 0) / K.N);
      r.set('lost', String(r.lost || 0) + ' / ' + (K.LOSE + 1));
      const me = r.me, d = me ? Math.max(0, r.gs - me.s) : K.PEN - K.S0;
      r.set('gate', Math.round(d) + ' m');
    },
  });
})();
