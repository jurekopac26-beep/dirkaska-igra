/* Special mission 40 · Varnostni avto · Bathurst, Avstralija (js/missions.js; the kit: js/missions/kit.js). A race car has hit the wall at the
   top of the hill (Skyline, K.CRASH m from the line); the race is under the safety car: the player's car (VORTEX in white, an orange light bar
   on its roof that flashes while it leads) on pole, the field of K.NAI queued behind it: the race's own AI cars, each its pace capped every step
   by the gap to the car ahead and by the lap's own safe pace (skCap, as the escort in m06.js); race.fl with the safety car out and no car of its
   own: nobody overtakes (Race._noPass), the HUD's board reads VARNOSTNI AVTO. The reference (K.VSC on the straights, sqrt(K.LAT / k) in the
   bends, from a standstill on the grid: a lap of ~230 s) gives DELTA (+ slower than it); too slow and the field's tyres cool (GUME: at K.TCOLD
   °C failed), too fast and the queue falls apart (KOLONA: the gap to the first car; over K.BREAK m for K.BREAKT s failed). The marshals clear
   the wreck (ODSTRANJEVANJE over K.CLR s: a recovery truck's crane lifts it onto its bed, marshals with yellow flags, green once clear); then
   UGASNI LUČI and into the pit lane at the end of the lap (on the left before the line: P.inPit): done, the stars by DELTA there (K.D3, K.D2 s).
   Into the pits with the lights on (or before the road is clear), or over the line without going in: failed. */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js');
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s), dec = (s) => (typeof Lang !== 'undefined' ? Lang.dec(s) : String(s));
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const K = { NAI: 8, VSC: 36, LAT: 6.5, ACC: 2.6, DEC: 5.5, ACC0: 3.5, G: 16, KG: 0.45, CAP: 1.08, CRASH: 2760, SIDE: 1, CLR: 150,
    T0: 88, TEQ: 90, TK: 110, TCOLD: 60, TWARN: 72, TAU: 20, RSM: 3, WARN: 45, BREAK: 90, BREAKT: 4, LIMIT: 420, D3: 6, D2: 15 };
  const has3 = () => typeof THREE !== 'undefined' && typeof Render !== 'undefined' && !!Render.scene;
  // a tag's place for MisKit.tags: one farther than half the camera's reach pulled in along the line of sight (the same spot on the screen)
  const reach = (C, x, y, z) => { if (!C) return { x, y, z }; const dx = x - C.position.x, dy = y - C.position.y, dz = z - C.position.z, d = Math.hypot(dx, dy, dz), m = 0.5 * (C.far || 400); if (d <= m) return { x, y, z }; const k = m / d; return { x: C.position.x + dx * k, y: C.position.y + dy * k, z: C.position.z + dz * k }; };
  const WHT = 0xdfe3e8, BLK = 0x1b1d21, GRY = 0x6d747b, YEL = 0xffc21a, CAB = 0xf08a1c, GLS = 0x1d2733, WRK = 0x2f5fb8, WRK2 = 0x1d3c78;
  // the safety car's lap: the pace on the circuit (each point of the track: K.VSC, the bends, braking K.DEC and pulling away K.ACC)
  function lapPace(T) {
    if (T._m40) return T._m40;
    const N = T.N, v = new Float32Array(N);
    for (let i = 0; i < N; i++) { let km = 0; for (let k = -6; k <= 6; k++) km = Math.max(km, Math.abs(T.k[(i + k + N) % N])); v[i] = Math.min(K.VSC, km > 1e-5 ? Math.sqrt(K.LAT / km) : K.VSC); }
    for (let it = 0; it < 2; it++) {
      for (let i = N - 1; i >= 0; i--) { const j = (i + 1) % N; v[i] = Math.min(v[i], Math.sqrt(v[j] * v[j] + 2 * K.DEC * T.ds)); }
      for (let i = 0; i < N; i++) { const j = (i + N - 1) % N; v[i] = Math.min(v[i], Math.sqrt(v[j] * v[j] + 2 * K.ACC * T.ds)); }
    }
    return (T._m40 = v);
  }

  Missions.add({
    id: '40', title: 'Varnostni avto', track: 'bathurst', car: 'vortex', limit: K.LIMIT, stars: null, K,
    story: 'Dirkalnik je trčil v zid na vrhu griča. Proga je pod rumeno zastavo, kolona čaka nate.',
    goal: 'Vodi kolono s pravo hitrostjo, dokler ne odpeljejo razbitega avta, nato ugasni luči in se umakni v bokse.',
    hint: 'Vozi s pravo hitrostjo: prepočasi se gume ohladijo, prehitro kolona razpade.',
    rows: [{ k: 'delta', label: 'DELTA' }, { k: 'kol', label: 'KOLONA', bar: true, col: '#4a8cff' }, { k: 'odst', label: 'ODSTRANJEVANJE', bar: true, col: '#ffd21f' }, { k: 'gume', label: 'GUME', bar: true, col: '#3fbf6a' }],
    // the field on the grid behind the player's car on pole, one lap, dry, no damage
    opts: () => ({ tt: false, numAI: K.NAI, playerGrid: 1, laps: 1, damage: 0, playerColor: WHT }),
    // the safety car out with no car of its own: nobody overtakes, the board on the HUD (before the race is drawn; again in begin)
    made(race) { race.fl = { yel: [], ev: 0, evK: '', sc: { car: null, state: 'mis', t: 0, lap0: 0 }, scUsed: true, pev: 0, pevK: '' }; },
    begin(r) {
      const R = r.race, T = R.track, P = r.P;
      if (!(R.fl && R.fl.sc && R.fl.sc.state === 'mis')) this.made(R);
      r.pace = lapPace(T); r.ref = this.ref(r, T, P.dist);
      r.temp = K.T0; r.rs = 1; r.brkT = 0; r.clr = 0; r.clear = false; r.off = false; r.delta = 0; r.g1 = null; r.msg = null; r.press = false;
      r.pitS = (T.raceLen || T.len) + (T.def.pit ? T.def.pit[1] : -215);   // (the way into the pit lane: race metres)
      if (has3()) this.build(r);
      this.show(r);
    },
    // the reference from the grid: from a standstill (K.ACC0) to the lap's own pace, every 2 m of the race; its time there
    ref(r, T, d0) {
      const V = r.pace, n = Math.ceil(((T.raceLen || T.len) + 80 - d0) / 2) + 1, v = new Float32Array(n), t = new Float32Array(n);
      for (let j = 1; j < n; j++) { const vp = V[T.idx(T.startS + d0 + j * 2)]; v[j] = Math.min(vp, Math.sqrt(v[j - 1] * v[j - 1] + 2 * K.ACC0 * 2)); t[j] = t[j - 1] + 4 / Math.max(0.5, v[j] + v[j - 1]); }
      return { d0, n, v, t };
    },
    vD(r, d) { const R = r.ref, f = clamp((d - R.d0) / 2, 0, R.n - 1.001), j = Math.floor(f); return R.v[j] + (R.v[j + 1] - R.v[j]) * (f - j); },
    tD(r, d) { const R = r.ref, f = clamp((d - R.d0) / 2, 0, R.n - 1.001), j = Math.floor(f); return R.t[j] + (R.t[j + 1] - R.t[j]) * (f - j); },
    step(r, dt) {
      const R = r.race, T = R.track, P = r.P, v = Math.hypot(P.vx || 0, P.vz || 0);
      // the field: each car's pace capped by the gap to the one ahead (the safety car first) and by the lap's own pace
      const O = R.cars.filter(c => !c.finished).sort((a, b) => b.dist - a.dist);
      let g1 = null;
      for (let k = 0; k < O.length; k++) {
        const c = O[k]; if (c.isPlayer) continue;
        if (c.fl) c.fl.stopT = 0;   // (the queue standing behind the safety car: no yellow flags for it)
        const A = O[k - 1], cv = Math.hypot(c.vx, c.vz); if (!A) { c.skCap = 0.5; continue; }   // (one ahead of the safety car: waits for it)
        const gap = A.dist - c.dist; if (A === P) g1 = gap;
        let vd = Math.max(0, (A.vl || 0) + (gap - K.G) * K.KG); vd = Math.min(vd, r.pace[T.idx(c.q.s + cv * 0.6)] * K.CAP + 1);
        const vp = (c.vprof || R.vprof)[T.idx(c.q.s + cv * 0.22 + 3)]; c.skCap = clamp(vd / Math.max(1, vp), 0.02, 1.1);
      }
      if (P.fl) { P.fl.stopT = 0; P.fl.ah = null; P.fl.owe = null; }   // (the safety car leads: no warnings for passing)
      r.g1 = g1;
      // DELTA, the tyres (the speed against the reference's, over a few seconds), the queue
      r.delta = r.t - this.tD(r, P.dist);
      const rho = clamp(v / Math.max(8, this.vD(r, P.dist)), 0, 1.3); r.rs += (rho - r.rs) * Math.min(1, dt / K.RSM);
      const teq = Math.max(20, K.TEQ - K.TK * Math.max(0, 1 - r.rs)); r.temp += (teq - r.temp) * Math.min(1, dt / K.TAU);
      r.brkT = g1 != null && g1 > K.BREAK ? r.brkT + dt : 0;
      if (r.brkT > K.BREAKT) { this.show(r); r.fail(tr('Kolona je razpadla: vozil si prehitro.')); return; }
      if (r.temp < K.TCOLD) { this.show(r); r.fail(tr('Dirkalnikom so se ohladile gume: vozil si prepočasi.')); return; }
      // the wreck cleared; then the lights off (the button, or the tests' driver)
      r.clr = Math.min(1, r.t / K.CLR);
      if (r.clr >= 1 && !r.clear) { r.clear = true; r.msg = ['Proga je čista! Ugasni luči: v tem krogu greš v bokse.', 5]; }
      const tap = r.btn ? r.btn.take() : false;
      if (r.clear && !r.off && (tap || r.press)) { r.off = true; r.msg = ['Luči so ugasnjene: na koncu kroga zapelji levo v bokse.', 4]; }
      // into the pit lane: done with the lights off, failed with them on
      if (P.inPit) {
        this.show(r);
        if (!r.off) { r.fail(tr(r.clear ? 'V bokse si zapeljal s prižganimi lučmi: kolona ni vedela, da se dirka nadaljuje.' : 'V bokse si zapeljal, preden je bila proga čista.')); return; }
        r.win(); const a = Math.abs(r.delta); r.stars = a <= K.D3 ? 3 : a <= K.D2 ? 2 : 1; return;
      }
      if (r.msg && (r.msg[1] -= dt) <= 0) r.msg = null;
      const toCrash = K.CRASH - P.dist;
      r.say(r.msg ? r.msg[0] : g1 != null && g1 > K.WARN ? 'Prehitro! Kolona ne more slediti.' : r.temp < K.TWARN ? 'Prepočasi! Gume dirkalnikov se hladijo.'
        : r.off ? 'Luči so ugasnjene: na koncu kroga zapelji levo v bokse.' : r.clear ? 'Proga je čista: ugasni luči, v tem krogu greš v bokse.'
        : toCrash > -60 && toCrash < 500 ? 'Na vrhu griča je razbit avto: počasi mimo redarjev.' : this.hint);
      if (r.fx) this.draw(r, dt);
      this.show(r);
    },
    // over the line without going in: the field still behind the safety car
    finish(r) { if (!r.end) r.fail(tr('Nisi zapeljal v bokse: kolona je ostala za tabo.')); },
    show(r) {
      const d = r.delta || 0, a = Math.abs(d);
      r.set('delta', (d >= 0 ? '+' : '−') + dec(a.toFixed(1)) + ' s', null, a <= K.D3 ? '#3fbf6a' : a <= K.D2 ? '#ffb020' : '#e8452c');
      const g = r.g1 == null ? null : Math.max(0, r.g1);
      r.set('kol', g == null ? '—' : Math.round(g) + ' m', g == null ? 0 : 1 - clamp(g / K.BREAK, 0, 1), g != null && g > K.WARN ? '#e8452c' : null);
      r.set('odst', Math.round(r.clr * 100) + ' %', r.clr, r.clear ? '#3fbf6a' : null);
      r.set('gume', Math.round(r.temp) + ' °C', clamp((r.temp - 40) / 60, 0, 1), r.temp < K.TWARN ? '#4a8cff' : null);
      if (r.btn) r.btn.show(r.clear && !r.off && !r.end);
    },
    // the tests' and the pictures' driver: the reference pace (o.pace times it), the lights off once the road is clear (o.never: never), into
    // the pit lane at the end of the lap (o.noPit: on over the line)
    pilot(r, o) {
      o = Object.assign({ pace: 1, never: false, noPit: false }, o);
      const P = r.P, T = r.race.track; if (!P.q) return [0, 0, 1];
      const v = Math.hypot(P.vx || 0, P.vz || 0), toPit = r.pitS - P.dist, sd = T.def.pit && T.def.pit[0] < 0 ? -1 : 1;
      r.press = !o.never && r.clear;
      return KIT.pilot(P, T, { v: this.vD(r, P.dist + v * 0.6) * o.pace, lat: K.LAT, off: !o.noPit && toPit < 40 && toPit > -300 ? sd * 9 : 0, look: 9 });
    },

    /* ---------------- the look: the light bar, the wreck, the recovery truck, the marshals ---------------- */
    build(r) {
      const T = r.race.track, P = r.P, fx = r.fx = {}, W = Render.world;
      const gy = (x, z, i) => { const g = W && W.groundH ? W.groundH(x, z) : NaN; return Number.isFinite(g) ? g : (T.hy ? T.hy[i] : 0); };
      const at = (s, off) => { const i = T.idx(T.startS + s); const x = T.px[i] + T.nx[i] * off, z = T.pz[i] + T.nz[i] * off; return { x, z, y: gy(x, z, i), h: T.hd[i], i }; };
      // the light bar on the roof (the number off): two lamps that flash in turn
      const V = Render.viewOf ? Render.viewOf(P) : null;
      if (V && V.bodyG) {
        const w = P.m.wid * 0.62, bar = new THREE.Group(), mBar = new THREE.MeshLambertMaterial({ color: 0x1a1a1a }), mOff = new THREE.MeshLambertMaterial({ color: 0x5a3608 }), mOn = new THREE.MeshBasicMaterial({ color: 0xffa21a });
        bar.add(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, w), mBar));
        fx.lamps = [-1, 1].map(sd => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, w * 0.34), mOff); l.position.set(0, 0.08, sd * w * 0.3); bar.add(l); return l; });
        const dp = V.dec ? V.dec.position : { x: 0, y: 1.25 }, dv = V.dec ? V.dec.visible : null;
        bar.position.set(dp.x, dp.y + 0.05, 0); bar.traverse(o => { o.userData.farKeep = 1; }); if (V.dec) V.dec.visible = false; V.bodyG.add(bar);
        fx.mOn = mOn; fx.mOff = mOff; fx.bar = bar;
        const u = new THREE.Group(); u.userData.misUndo = () => { V.bodyG.remove(bar); bar.traverse(x => { if (x.geometry) x.geometry.dispose(); }); [mBar, mOff, mOn].forEach(m => m.dispose()); if (V.dec && dv != null) V.dec.visible = dv; }; r.add(u);
      }
      // the recovery truck by the wall at the top of the hill (on the verge and the road's edge, away from the racing line), its crane
      const sd = K.SIDE, tk = at(K.CRASH - 16, sd * 5.9), mat = new THREE.MeshLambertMaterial({ vertexColors: true });
      const B = KIT.parts();
      B.box(0, 0.75, 0, 7.4, 0.35, 2.2, BLK); B.box(2.75, 1.75, 0, 1.9, 1.9, 2.3, CAB); B.box(3.71, 2.1, 0, 0.04, 0.8, 2.0, GLS); B.box(2.75, 2.1, 0, 1.92, 0.5, 2.32, GLS);
      B.box(-0.9, 1.15, 0, 5.0, 0.2, 2.4, GRY); B.box(-3.35, 1.0, 0, 0.12, 0.5, 2.4, YEL); B.box(1.55, 1.25, 0, 0.12, 0.6, 2.4, GRY);
      B.box(1.25, 2.4, 0, 0.4, 2.3, 0.4, YEL); B.box(-0.55, 3.55, 0, 4.0, 0.32, 0.32, YEL); B.box(-2.55, 3.35, 0, 0.3, 0.5, 0.3, YEL);
      for (const x of [2.6, -1.6, -2.9]) for (const s2 of [-1, 1]) B.cyl(x, 0.5, s2 * 1.05, 0.5, 0.4, BLK);
      const truck = B.mesh(mat); truck.position.set(tk.x, tk.y, tk.z); truck.rotation.y = -tk.h; truck.castShadow = true; r.add(truck);
      const bm = new THREE.MeshBasicMaterial({ color: 0xffa21a }), beacon = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 1.3), bm); beacon.position.set(2.75, 2.78, 0); truck.add(beacon);
      fx.truck = truck; fx.bm = bm;
      // the wreck: a race car crumpled at the wall, one wheel off beside it; the crane's cable
      const Wk = KIT.parts();
      Wk.box(0, 0.42, 0, 4.4, 0.46, 1.9, WRK); Wk.box(-0.35, 0.82, 0, 1.7, 0.4, 1.35, GLS); Wk.box(1.95, 0.36, 0.25, 0.8, 0.4, 1.7, WRK2, 0.35); Wk.box(-2.15, 0.92, 0, 0.32, 0.06, 1.8, BLK);
      Wk.box(-2.15, 0.7, 0.7, 0.1, 0.4, 0.06, BLK); Wk.box(-2.15, 0.7, -0.7, 0.1, 0.4, 0.06, BLK);
      for (const [x, z] of [[1.45, -0.98], [-1.45, -0.98], [-1.45, 0.98]]) Wk.cyl(x, 0.34, z, 0.34, 0.3, BLK);
      const wreck = Wk.mesh(mat); wreck.castShadow = true; r.add(wreck); fx.wreck = wreck;
      const Wl = KIT.parts(); Wl.disc(0, 0.15, 0, 0.34, 0.3, BLK); const wheel = Wl.mesh(mat); const wp = at(K.CRASH + 9, sd * 6.3); wheel.position.set(wp.x, wp.y, wp.z); r.add(wheel);
      const cable = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1, 0.05), new THREE.MeshLambertMaterial({ color: 0x222222 })); cable.visible = false; r.add(cable); fx.cable = cable;
      const c0 = at(K.CRASH, sd * 6.0);
      fx.w0 = { x: c0.x, y: c0.y, z: c0.z, h: c0.h - sd * 0.55 };   // (nose into the wall)
      const fw = { x: Math.cos(tk.h), z: Math.sin(tk.h) };
      fx.w1 = { x: tk.x - fw.x * 5.6, y: tk.y, z: tk.z - fw.z * 5.6, h: tk.h };   // (winched up behind the truck)
      fx.w2 = { x: tk.x - fw.x * 0.9, y: tk.y + 1.25, z: tk.z - fw.z * 0.9, h: tk.h };   // (on its bed)
      fx.tip = { x: tk.x - fw.x * 2.55, y: tk.y + 3.2, z: tk.z - fw.z * 2.55 };
      // the marshals in orange: two at the wreck, one by the truck, two at the post before it (yellow flags, green once the road is clear)
      const men = KIT.crowd(r, 5), spots = [[K.CRASH + 14, sd * 6.5], [K.CRASH - 4, sd * 6.6], [K.CRASH - 27, sd * 6.5], [K.CRASH - 160, -sd * 6.5], [K.CRASH - 166, -sd * 6.5]];
      fx.flags = [];
      spots.forEach(([s, off], k) => { const p = at(s, off); men.put(k, p.x, p.y, p.z, -p.h + (off > 0 ? -Math.PI / 2 : Math.PI / 2), 0xff7a1a); if (k !== 2) fx.flags.push({ x: p.x + Math.cos(p.h) * 0.3, y: p.y, z: p.z + Math.sin(p.h) * 0.3, h: p.h, ph: k * 1.7 }); });
      const n = fx.flags.length;
      fx.pole = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 6).translate(0, 1.2, 0), new THREE.MeshLambertMaterial({ color: 0xd8d8d8 }), n);
      fx.cloth = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.95, 0.62).translate(0.5, 0, 0), new THREE.MeshLambertMaterial({ color: 0xffd21f, side: THREE.DoubleSide }), n);
      for (const m of [fx.pole, fx.cloth]) { m.frustumCulled = false; r.add(m); }
      // the tags; the button
      fx.pit = at(r.pitS + 60, (T.def.pit && T.def.pit[0] < 0 ? -1 : 1) * 12);
      r.btn = KIT.button(r, 'UGASNI LUČI');
      r.tags = KIT.tags(r);
    },
    draw(r, dt) {
      const fx = r.fx, P = r.P, C = Render.camera, t = r.t;
      // the light bar: the lamps in turn while it leads, dark once off
      if (fx.lamps) { const ph = (t * 2.6) % 1 < 0.5; fx.lamps[0].material = !r.off && ph ? fx.mOn : fx.mOff; fx.lamps[1].material = !r.off && !ph ? fx.mOn : fx.mOff; }
      fx.bm.color.setHex((t * 1.7) % 1 < 0.5 ? 0xffa21a : 0x4a2a06);
      // the wreck: at the wall, winched to the truck's back, lifted onto its bed
      const c = r.clr, A = fx.w0, B = fx.w1, D = fx.w2, sm = (u) => u * u * (3 - 2 * u);
      let p;
      if (c < 0.3) p = A;
      else if (c < 0.55) { const u = sm((c - 0.3) / 0.25); p = { x: A.x + (B.x - A.x) * u, y: A.y + (B.y - A.y) * u, z: A.z + (B.z - A.z) * u, h: A.h + (B.h - A.h) * u }; }
      else if (c < 0.8) { const u = sm((c - 0.55) / 0.25); p = { x: B.x + (D.x - B.x) * u, y: B.y + (D.y - B.y) * u + Math.sin(u * Math.PI) * 1.2, z: B.z + (D.z - B.z) * u, h: B.h }; }
      else p = D;
      fx.wreck.position.set(p.x, p.y, p.z); fx.wreck.rotation.y = -p.h;
      const lift = c >= 0.3 && c < 0.8;
      fx.cable.visible = lift;
      if (lift) { const y0 = p.y + 1.05, L = Math.max(0.2, Math.hypot(fx.tip.x - p.x, fx.tip.y - y0, fx.tip.z - p.z)); fx.cable.position.set((fx.tip.x + p.x) / 2, (fx.tip.y + y0) / 2, (fx.tip.z + p.z) / 2); fx.cable.scale.set(1, L, 1); fx.cable.lookAt(fx.tip.x, fx.tip.y, fx.tip.z); fx.cable.rotateX(Math.PI / 2); }
      // the flags: waving yellow, green once the road is clear
      const M = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e3 = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1), v3 = new THREE.Vector3();
      fx.flags.forEach((f, k) => {
        M.compose(v3.set(f.x, f.y, f.z), q4.setFromEuler(e3.set(0, -f.h, 0)), one); fx.pole.setMatrixAt(k, M);
        const w = Math.sin(t * 7 + f.ph); M.compose(v3.set(f.x, f.y + 2.05 + 0.25 * w, f.z), q4.setFromEuler(e3.set(0.35 * w, -f.h + 0.9 * w, 0.2 * w)), one); fx.cloth.setMatrixAt(k, M);
      });
      fx.pole.instanceMatrix.needsUpdate = fx.cloth.instanceMatrix.needsUpdate = true;
      fx.cloth.material.color.setHex(r.clear ? 0x2fbf4a : 0xffd21f);
      // the tags: the wreck while it is being cleared; the way into the pits once the lights are off
      if (r.tags) {
        const L = [], toCrash = K.CRASH - P.dist, toPit = r.pitS - P.dist;
        if (!r.clear && toCrash > -20 && toCrash < 700) L.push(Object.assign(reach(C, fx.w0.x, fx.w0.y + 3.5, fx.w0.z), { html: '<b>' + tr('RAZBIT AVTO') + '</b>' + Math.round(c * 100) + ' %', cls: 'hot' }));
        if (r.off && toPit > 0 && toPit < 900) L.push(Object.assign(reach(C, fx.pit.x, fx.pit.y + 3, fx.pit.z), { html: '<b>' + tr('BOKSI') + '</b>' + Math.round(toPit) + ' m', cls: 'go' }));
        r.tags.set(L);
      }
    },
  });
})();
