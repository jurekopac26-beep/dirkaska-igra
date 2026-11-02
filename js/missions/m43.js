/* Special mission 43 · Vroče zavore · Rio do Rastro, Brazilija (js/missions.js; the kit: js/missions/kit.js). A heavy truck (the racing
   truck's physics, 26 t, MisKit.skin) goes down the hairpins: the road driven the other way, from K.S0 m past the start line (at the top)
   down to K.END (in the valley; the wrong way allowed: P.wrongT kept at 0). Its own gearbox (PRESTAVA 1..5, NIŽJE and VIŠJE: MisKit.keys):
   each gear its top speed K.VG (the limiter) and its engine braking K.EB (off the throttle; the faster over the gear's speed, the harder),
   a lower gear only under 1.1 x its top speed. The brakes heat up with braking (MisKit.brakes; ZAVORE): hot, they fade; at K.GONE they are
   gone (no braking at all) until they cool to K.BACK. Too fast (over K.RUN km/h): the truck ran away, failed; into a bend too fast (the speed squared over the road's bend over K.LAT m/s2): off the road, failed; a hard knock
   (over K.HIT m/s): failed. Its weight: K.GX more of the slope's pull than the race's physics gives. The escape lanes (IZLETNI PAS, K.RAMPS): sand beds on the right half of the road (driven down: the side of
   -n), in them the truck slows hard and the brakes cool fast. */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js');
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s);
  const dec = (s) => (typeof Lang !== 'undefined' && Lang.dec ? Lang.dec(s) : String(s).replace('.', ','));
  const K = { S0: 4050, END: 900, VG: [22, 34, 48, 64, 82], EB: [2.3, 1.6, 1.05, 0.65, 0.35], G0: 3, RUN: 88, GONE: 1.2, BACK: 0.6, HIT: 9,
    RAMPS: [[3390, 3480], [2240, 2330], [1560, 1650]], SAND: 4.0, RD: -0.4, HEAT: 0.022, GX: 1.3, LAT: 5.5 };
  const CAB = 0x2a6fb8, BOX = 0xe6e8ea, GLS = 0x1d2733, BLK = 0x1b1d21, GRY = 0x9aa1a8;

  // the truck: a cab-over in front, the box body behind it, three axles (x forward, y up, z to the side)
  function truck(B) {
    B.box(3.6, 1.85, 0, 2.2, 2.5, 2.5, CAB); B.box(4.71, 2.25, 0, 0.04, 0.9, 2.2, GLS); B.box(3.4, 3.2, 0, 1.6, 0.2, 2.3, 0x24609e);
    B.box(-1.4, 2.15, 0, 7.4, 3.1, 2.55, BOX); B.box(-1.4, 3.72, 0, 7.3, 0.06, 2.45, 0xf5f7fa); B.box(-1.4, 0.75, 0, 7.8, 0.3, 1.4, BLK);
    for (const sd of [-1, 1]) B.box(-1.4, 1.2, sd * 1.28, 7.2, 0.18, 0.04, 0xd8282a);
    for (const x of [3.4, -3.0, -4.3]) for (const sd of [-1, 1]) B.cyl(x, 0.52, sd * 1.05, 0.52, 0.4, BLK);
    B.box(4.73, 1.0, 0.9, 0.04, 0.22, 0.4, 0xfff4cc); B.box(4.73, 1.0, -0.9, 0.04, 0.22, 0.4, 0xfff4cc);
    B.box(-5.12, 1.0, 1.0, 0.04, 0.25, 0.25, 0xff3a2a); B.box(-5.12, 1.0, -1.0, 0.04, 0.25, 0.25, 0xff3a2a);
  }
  // the sand of an escape lane: a band on the right half of the road (going down), its kerb of tyres at the far end, a sign
  function ramp(r, T, s0, s1) {
    const B = KIT.band(r, 200, { tex: KIT.snowTex('fresh'), rep: 3, across: 1, col: 0xd9b77a, order: 1 });
    for (let s = s1; s >= s0; s -= 4) { const i = T.idx(s), w = T.wS(s), c = (K.RD - w) / 2, hw = (w + K.RD) / 2 * -1; B.add(T.px[i] + T.nx[i] * c, T.hy[i] + 0.06, T.pz[i] + T.nz[i] * c, T.nx[i] * Math.abs(hw), T.nz[i] * Math.abs(hw)); }
    B.cut();
    const P = KIT.parts(), i = T.idx(s1 + 6), g = new THREE.Group(), w = T.wS(s1);
    P.box(0, 1.4, 0, 0.12, 2.8, 0.12, 0x5a5e64); P.box(0, 2.9, 0, 0.1, 1.0, 1.8, 0x2f8a3a); P.box(0.02, 2.9, 0, 0.1, 0.7, 1.5, 0xffffff);
    g.add(P.mesh(new THREE.MeshLambertMaterial({ vertexColors: true })));
    g.position.set(T.px[i] - T.nx[i] * (w + 0.8), T.hy[i], T.pz[i] - T.nz[i] * (w + 0.8)); g.rotation.y = -Math.atan2(T.tz[i], T.tx[i]) + Math.PI;
    r.add(g);
  }

  Missions.add({
    id: '43', title: 'Vroče zavore', track: 'rastro', limit: 420, stars: [300, 345], K,
    story: 'Težak tovornjak se spušča po strmih serpentinah. Zavore so vse bolj vroče.',
    goal: 'Spusti se do doline brez pregretih zavor. Če zavore odpovejo, zapelji na izletni pas.',
    hint: 'Prestavi nižje in zaviraj z motorjem; če zavore odpovejo, zapelji na izletni pas.',
    rows: [{ k: 'zavore', label: 'ZAVORE', bar: true }, { k: 'prestava', label: 'PRESTAVA' }, { k: 'dol', label: 'DO DOLINE' }],
    // alone down the pass by day; the truck: the racing truck's physics, heavy, its limiter the gear's
    opts: () => ({ tt: true, playerModel: KIT.truckModel('titan', { vLim: K.VG[K.G0 - 1], kw: 420, len: 9.8, wid: 2.55, mass: 26000 }), playerColor: CAB, damage: 0 }),
    made(race) {
      const T = race.track, c = race.player; if (!c) return;
      const s = T.startS + K.S0, i = T.idx(s);
      c.place(T.px[i], T.pz[i], T.hd[i] + Math.PI); if (T.hasElev) { c.y = c.py = T.hy[i]; c.roadY = c.y; }
      c.dist = s - T.startS; c.q = T.query(T.px[i], T.pz[i], i, {}); c.sPrev = c.q.s;
      while (c.cp < T.cpS.length && c.dist >= T.cpDist[c.cp]) { c.splits.push(0); c.cp++; }
    },
    begin(r) {
      const T = r.race.track;
      r.gear = K.G0; r.br = KIT.brakes({ heat: K.HEAT }); r.gone = false; r.sand = false; r.sEnd = T.startS + K.END; r.used = 0;
      if (typeof THREE !== 'undefined' && typeof document !== 'undefined') {
        r.skin = KIT.skin(r, r.P, truck);
        if (r.skin) { const v = Render.viewOf(r.P); if (v && v.lights && v.lights.length >= 4) { v.lights[0].set(4.75, 1.0, -0.9); v.lights[1].set(4.75, 1.0, 0.9); v.lights[2].set(-5.14, 1.0, -1.0); v.lights[3].set(-5.14, 1.0, 1.0); } }
        for (const [a, b] of K.RAMPS) ramp(r, T, T.startS + a, T.startS + b);
        r.tags = KIT.tags(r);
        r.keys = KIT.keys(r, [{ k: 'dn', label: 'NIŽJE' }, { k: 'up', label: 'VIŠJE' }]); r.keys.show(true);
      }
      if (r.P.m) r.P.m.vLim = K.VG[r.gear - 1];
      this.show(r);
    },
    // the escape lane under the truck (s, d): its index or -1
    rampAt(T, s, d) { for (let k = 0; k < K.RAMPS.length; k++) { const [a, b] = K.RAMPS[k]; if (s >= T.startS + a && s <= T.startS + b && d < K.RD + 0.6) return k; } return -1; },
    shift(r, dir) {
      const v = Math.hypot(r.P.vx || 0, r.P.vz || 0) * 3.6;
      if (dir < 0 && r.gear > 1) { if (v < K.VG[r.gear - 2] * 1.1) r.gear--; else r.warnT = 2; }
      if (dir > 0 && r.gear < K.VG.length) r.gear++;
      if (r.P.m) r.P.m.vLim = K.VG[r.gear - 1];
    },
    step(r, dt) {
      const P = r.P, T = r.race.track, q = P.q; if (!q) return;
      P.wrongT = 0;
      if (r.keys) { if (r.keys.take('dn')) this.shift(r, -1); if (r.keys.take('up')) this.shift(r, 1); }
      if (r.warnT > 0) r.warnT -= dt;
      // the heavy truck's weight down the slope (the race's physics is a car's: its own engine braking and drag hold a lorry back too much)
      if (P.gradeNow && !P.locked) { const gH = P.gradeNow * (Math.cos(P.h) * (q.tx || 0) + Math.sin(P.h) * (q.tz || 0)), a = -9.81 * gH * K.GX * dt; P.vx += Math.cos(P.h) * a; P.vz += Math.sin(P.h) * a; }
      const v = Math.hypot(P.vx || 0, P.vz || 0);
      // the engine's braking off the throttle: the gear's own, harder over the gear's speed
      if ((P.inThr || 0) < 0.1 && v > 0.5) { const vg = K.VG[r.gear - 1] / 3.6, dv = Math.min(v - 0.3, K.EB[r.gear - 1] * Math.max(0.3, Math.min(1.8, v / vg)) * dt); P.vx -= P.vx / v * dv; P.vz -= P.vz / v * dv; }
      // the escape lane: the sand slows it hard, the brakes cool
      const rk = this.rampAt(T, q.s, q.d); r.sand = rk >= 0;
      if (r.sand && v > 0.3) { const dv = Math.min(v, K.SAND * dt * Math.min(1, 0.4 + v / 8)); P.vx -= P.vx / v * dv; P.vz -= P.vz / v * dv; if (!r.inSand) r.used++; }
      r.inSand = r.sand;
      // the brakes: hot, they fade; gone until they cool
      const heat = r.br.step(P, dt, r.sand ? 1 : 0);
      if (heat >= K.GONE) r.gone = true; else if (r.gone && heat < K.BACK) r.gone = false;
      if (r.gone && (P.inBrk || 0) > 0 && v > 0.5) { const back = Math.min(13 * P.inBrk * dt, v * 0.5) * (1 - r.br.fade); P.vx += P.vx / v * back; P.vz += P.vz / v * back; }
      if (v * 3.6 > K.RUN) { r.fail(tr('Tovornjak je ušel po klancu navzdol.')); this.show(r); return; }
      { const i = T.idx(q.s - 6), j = T.idx(q.s + 6); let a = Math.atan2(T.tz[j], T.tx[j]) - Math.atan2(T.tz[i], T.tx[i]); a = Math.atan2(Math.sin(a), Math.cos(a));
        if (v * v * Math.abs(a / 12) > K.LAT) { r.fail(tr('Tovornjak je prehitro zapeljal v ovinek in zletel s ceste.')); this.show(r); return; } }
      if ((P.hitWall || 0) > K.HIT) { r.fail(tr('Tovornjak je močno trčil.')); this.show(r); return; }
      if (q.s <= r.sEnd) { r.win(); this.show(r); return; }
      if (r.tags) {
        const L = []; for (const [a, b] of K.RAMPS) { const sB = T.startS + b; if (q.s - sB > -10 && q.s - sB < 300) { const i = T.idx(sB), w = T.wS(sB) / 2; L.push({ x: T.px[i] - T.nx[i] * w, y: T.hy[i] + 3, z: T.pz[i] - T.nz[i] * w, html: '<b>' + tr('IZLETNI PAS') + '</b>' + tr('desno'), cls: r.gone ? 'go' : '' }); } }
        r.tags.set(L);
      }
      r.say(r.gone ? 'Zavore so odpovedale! Zapelji na izletni pas.' : r.sand ? 'Izletni pas: pesek ustavi tovornjak, zavore se hladijo.' : r.warnT > 0 ? 'Prehitro za nižjo prestavo: najprej zaviraj.'
        : heat > 0.6 ? 'Zavore se grejejo: prestavi nižje.' : v * 3.6 > K.RUN - 15 ? 'Prehitro! Zaviraj in prestavi nižje.' : this.hint);
      this.show(r);
    },
    show(r) {
      const T = r.race.track, h = r.br.heat, left = Math.max(0, ((r.P.q && r.P.q.s) || 0) - r.sEnd);
      r.set('zavore', r.gone ? tr('ODPOVEDALE') : Math.round(Math.min(1, h) * 100) + ' %', Math.min(1, h), h < 0.5 ? '#3fbf6a' : h < 0.85 ? '#ffb020' : '#e8452c');
      r.set('prestava', String(r.gear));
      r.set('dol', dec((left / 1000).toFixed(1)) + ' km');
      if (r.keys && r.keys.el) for (const b of r.keys.el.children) b.classList.toggle('sel', b.dataset.k === 'dn' && h > 0.6);
    },
  });
})();
