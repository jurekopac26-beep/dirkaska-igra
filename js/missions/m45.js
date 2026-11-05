/* Special mission 45 · Turistični vlakec · Livorno, Italija (js/missions.js; the kit: js/missions/kit.js). The road train for the tourists:
   a little black locomotive (MisKit.skin over the 4x4's physics, its own limiter K.VMAX) and three wagons with their passengers in a chain
   behind it (each pulled by its tongue at the coupling behind the unit ahead and rolling on its own axle K.LW m back: a trailer's own
   kinematics from the physics' P.x, P.z, P.h, as MisKit.towTrailer; drawn from where the locomotive is drawn, so they never lag it). From K.PRE m
   before the line on the seafront at Ardenza (MisKit.place in made: the sea on its left, the beach with its parasols) through the streets of
   Ardenza, under the railway and up the hill to the viewpoint under Montenero (K.STOP m from the line: a terrace over the slope towards the sea, a yellow box painted on the road). In a
   bend the wagons cut its inside, the last one the most: a corner of a wagon over the road's edge (T.query, T.wS: K.CURB m past it) is the
   kerb: the passengers jump (POTNIKI: K.P0, K.HIT less each time; at K.PMIN failed). OVINEK: the next sharp bend (under K.RC m) and its side,
   ZADNJI: the last wagon's room to the edge. Stopped in the yellow box (slower than K.VSTOP for K.HOLD s): done, the stars by the passengers
   still happy (K.P0 - K.HIT: 3, K.P0 - 3 K.HIT: 2, else 1); past the viewpoint by K.PAST m or the time up: failed. */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js');
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const K = { N: 3, VMAX: 8, C0: 2.6, LW: 3.6, LC: 4.9, BF: 0.6, BL: 4.0, BW: 1.9, CURB: 0.05, OFF: 0.3, WARN: 0.6, P0: 36, HIT: 3, PMIN: 18,
    PRE: 160, STOP: 3200, ZONE: 6, VSTOP: 0.6, HOLD: 1.0, PAST: 120, LIMIT: 720, AHEAD: 220, RC: 45 };
  const has3 = () => typeof THREE !== 'undefined' && typeof Render !== 'undefined' && !!Render.scene;
  // a tag's place for MisKit.tags: one farther than half the camera's reach pulled in along the line of sight (the same spot on the screen)
  const reach = (C, x, y, z) => { if (!C) return { x, y, z }; const dx = x - C.position.x, dy = y - C.position.y, dz = z - C.position.z, d = Math.hypot(dx, dy, dz), m = 0.5 * (C.far || 400); if (d <= m) return { x, y, z }; const k = m / d; return { x: C.position.x + dx * k, y: C.position.y + dy * k, z: C.position.z + dz * k }; };
  const BLK = 0x1b1d21, BLK2 = 0x2a2d33, RED = 0xc4161c, DRED = 0x8e0e12, WHT = 0xf2efe6, GLS = 0x1d2733, GLD = 0xd9a93a, YL = 0xf2c42c;
  const SHIRT = [0x2f6fb0, 0xf2c230, 0x3a9a4a, 0xe86a2c, 0xf2f2ee, 0x9a4ac4, 0x4ac4c0, 0xd6332a], SKIN = [0xe0b48f, 0xc98e66, 0x8d5a3b, 0xf0c9a5];
  // the sharp bends (radius under K.RC m) on the way to the viewpoint: [from, to] m from the line, their side (1 right, -1 left)
  function bends(T) {
    if (T._m45) return T._m45;
    const L = []; let c = null;
    for (let s = -K.PRE; s <= K.STOP; s += 2) {
      const k = T.k[T.idx(T.startS + s)], sharp = Math.abs(k) > 1 / K.RC;
      if (sharp && (!c || Math.sign(k) !== c.side)) { if (c) L.push(c); c = { a: s, b: s, side: Math.sign(k), R: 1 / Math.abs(k) }; }
      else if (sharp) { c.b = s; c.R = Math.min(c.R, 1 / Math.abs(k)); }
      else if (c) { L.push(c); c = null; }
    }
    if (c) L.push(c);
    return (T._m45 = L);
  }

  Missions.add({
    id: '45', title: 'Turistični vlakec', track: 'livorno', limit: K.LIMIT, stars: null, K,
    story: 'Turistični vlakec vozi goste ob morju in po ozkem ovinku navzgor do razgledne točke.',
    goal: 'Pelji vlakec skozi ovinke tako, da noben vagonček ne zadene robnika, in ustavi ob razgledni točki.',
    hint: 'Zavij široko: zadnji vagonček reže ovinek in zadene robnik.',
    rows: [{ k: 'ovinek', label: 'OVINEK' }, { k: 'potniki', label: 'POTNIKI', bar: true, col: '#3fbf6a' }, { k: 'zadnji', label: 'ZADNJI' }],
    // alone, one run up from the seafront, the locomotive on the 4x4's physics at most K.VMAX m/s (vLim is in km/h), no damage
    opts: () => ({ tt: true, laps: 1, playerModel: KIT.truckModel('medved', { vLim: K.VMAX * 3.6 }), playerColor: BLK, damage: 0 }),
    // the train put K.PRE m before the line, on the seafront promenade (the sea on its left)
    made(race) { const T = race.track, c = race.player; if (c) KIT.place(c, T, T.startS - K.PRE, false); },
    begin(r) {
      const T = r.race.track, P = r.P;
      r.bends = bends(T); r.happy = K.P0; r.hits = 0; r.stopT = 0; r.msg = null; r.pop = null;
      r.w = []; this.straight(r);
      if (has3()) this.build(r);
      this.step(r, 0);
    },
    // the wagons straight behind the locomotive
    straight(r) {
      const P = r.P; let hx = P.x - Math.cos(P.h) * K.C0, hz = P.z - Math.sin(P.h) * K.C0;
      r.w.length = 0;
      for (let k = 0; k < K.N; k++) { r.w.push({ h: P.h, hx, hz, ov: -9, on: false, j: 0 }); hx -= Math.cos(P.h) * K.LC; hz -= Math.sin(P.h) * K.LC; }
    },
    // the chain: each wagon's tongue at the coupling behind the unit ahead, its axle following (no further round than its stop, 1.3 rad)
    chain(r) {
      const P = r.P; let hx = P.x - Math.cos(P.h) * K.C0, hz = P.z - Math.sin(P.h) * K.C0, h0 = P.h;
      for (const w of r.w) {
        const dx = hx - w.hx, dz = hz - w.hz;
        if (Math.abs(dx) + Math.abs(dz) < 5) w.h += (-dx * Math.sin(w.h) + dz * Math.cos(w.h)) / K.LW;
        let rel = Math.atan2(Math.sin(w.h - h0), Math.cos(w.h - h0)); if (Math.abs(rel) > 1.3) { rel = Math.sign(rel) * 1.3; w.h = h0 + rel; }
        w.hx = hx; w.hz = hz; h0 = w.h;
        hx = w.hx - Math.cos(w.h) * K.LC; hz = w.hz - Math.sin(w.h) * K.LC;
      }
    },
    // a wagon's corners past the road's edge (m: + over it, - the room left), the most of the four
    over(r, w, s0) {
      const T = r.race.track, f = [Math.cos(w.h), Math.sin(w.h)], n = [-Math.sin(w.h), Math.cos(w.h)], Q = r.Q || (r.Q = {});
      let ov = -1e9;
      for (const x of [-K.BF, -(K.BF + K.BL)]) for (const z of [-K.BW / 2, K.BW / 2]) {
        const px = w.hx + f[0] * x + n[0] * z, pz = w.hz + f[1] * x + n[1] * z, q = T.query(px, pz, T.idx(s0), Q);
        ov = Math.max(ov, Math.abs(q.d) - T.wS(q.s));
      }
      return ov;
    },
    step(r, dt) {
      const T = r.race.track, P = r.P, v = Math.hypot(P.vx || 0, P.vz || 0), s = P.dist;
      this.chain(r);
      // the kerb: a wagon's corner over the road's edge (once each time it gets there)
      const s0 = P.q ? P.q.s : T.startS + s;
      r.w.forEach((w, k) => {
        w.ov = this.over(r, w, s0 - K.C0 - K.LC * (k + 0.5));
        const on = w.ov > (w.on ? K.CURB - K.OFF : K.CURB);   // (back off the kerb only K.OFF m inside its edge: one bump, not a flicker)
        if (on && !w.on && dt > 0) { r.hits++; r.happy = Math.max(0, r.happy - K.HIT); w.j = 0.5; r.msg = ['Robnik! Vagonček je zadel robnik, potniki so poskočili.', 2.5]; r.pop = { k, t: 1.5 }; }
        w.on = on; if (w.j > 0) w.j = Math.max(0, w.j - dt);
      });
      if (r.pop && (r.pop.t -= dt) <= 0) r.pop = null;
      if (r.happy <= K.PMIN) { this.show(r); r.fail(tr('Potniki so prestrašeni: preveč robnikov.')); return; }
      // the viewpoint: stopped in the yellow box
      const inBox = Math.abs(s - K.STOP) < K.ZONE;
      r.stopT = inBox && v < K.VSTOP ? r.stopT + dt : 0;
      if (r.stopT >= K.HOLD) { this.show(r); r.win(); r.stars = r.happy >= K.P0 - K.HIT ? 3 : r.happy >= K.P0 - 3 * K.HIT ? 2 : 1; return; }
      if (s > K.STOP + K.PAST) { this.show(r); r.fail(tr('Zapeljal si mimo razgledne točke.')); return; }
      // the next sharp bend
      r.bend = r.bends.find(c => c.b > s - 4) || null;
      const near = r.bend && r.bend.a - s < 70;
      if (r.msg && (r.msg[1] -= dt) <= 0) r.msg = null;
      r.say(r.msg ? r.msg[0] : s > K.STOP + K.ZONE ? 'Zapeljal si mimo okvirja: zapelji vzvratno do razgleda.' : K.STOP - s < 250 ? 'Ustavi v rumenem okvirju ob razgledni točki.'
        : near || r.w[K.N - 1].ov > -K.WARN ? this.hint : 'Pelji mirno: potniki uživajo v razgledu.');
      if (r.fx) this.draw(r, dt);
      this.show(r);
    },
    show(r) {
      const s = r.P.dist, c = r.bend;
      if (c && c.a - s < K.AHEAD) { const d = Math.round(c.a - s), side = tr(c.side > 0 ? 'DESNI' : 'LEVI'); r.set('ovinek', d > 0 ? side + ' · ' + d + ' m' : side + ' · ' + tr('ZDAJ'), null, d < 60 ? '#ffb020' : null); }
      else r.set('ovinek', '—');
      r.set('potniki', String(r.happy), r.happy / K.P0, r.happy < K.P0 - 3 * K.HIT ? '#e8452c' : r.happy < K.P0 ? '#ffb020' : null);
      const o = r.w[K.N - 1].ov;
      r.set('zadnji', tr(o > K.CURB ? 'NA ROBNIKU' : o > -K.WARN ? 'REŽE OVINEK' : 'NA CESTI'), null, o > K.CURB ? '#e8452c' : o > -K.WARN ? '#ffb020' : '#3fbf6a');
    },
    // the tests' and the pictures' driver: up the road at o.v m/s, wide through the sharp bends (o.cut: on their inside), stopped in the box
    pilot(r, o) {
      o = Object.assign({ v: K.VMAX, cut: false }, o);
      const P = r.P, T = r.race.track; if (!P.q) return [0, 0, 1];
      const s = P.dist, c = r.bends.find(b => s > b.a - 35 && s < b.b + 10), off = c ? (o.cut ? 2.6 : -1.6) * c.side : 0;
      if (Math.abs(s - K.STOP) < K.ZONE - 2) { const a = KIT.pilot(P, T, { v: 1, lat: 2, off: 0 }); return [a[0], 0, Math.hypot(P.vx, P.vz) > 0.5 ? 1 : 0.1]; }   // (stopped: the brake light, not held down: held, it would go into reverse)
      return KIT.pilot(P, T, { v: Math.min(o.v, Math.sqrt(2 * 1.1 * Math.max(0, K.STOP - s))), lat: 2, off, look: 7 });
    },

    /* ---------------- the look: the locomotive, the wagons, the beach, the viewpoint ---------------- */
    build(r) {
      const T = r.race.track, P = r.P, fx = r.fx = {}, W = Render.world;
      const gh = (x, z) => { const g = W && W.groundH ? W.groundH(x, z) : NaN; return Number.isFinite(g) ? g : NaN; };
      // the locomotive: black, red wheels and cab, a chimney with a golden band
      r.skin = KIT.skin(r, P, (B) => {
        B.box(0, 0.55, 0, 4.2, 0.3, 1.8, BLK); B.box(0.75, 1.2, 0, 2.5, 1.0, 1.25, BLK2); for (const x of [0.0, 1.0, 1.9]) B.box(x, 1.2, 0, 0.12, 1.04, 1.29, GLD);
        B.box(-1.25, 1.5, 0, 1.45, 1.6, 1.8, RED); B.box(-1.25, 1.75, 0, 1.47, 0.6, 1.5, GLS); B.box(-1.3, 2.36, 0, 1.8, 0.12, 2.0, BLK);
        B.box(1.65, 2.0, 0, 0.36, 0.7, 0.36, BLK); B.box(1.65, 2.4, 0, 0.56, 0.12, 0.56, GLD); B.box(2.15, 0.62, 0, 0.12, 0.3, 1.9, RED); B.box(2.12, 1.12, 0, 0.1, 0.24, 0.24, 0xffe9a8);
        for (const x of [1.3, 0.1, -1.3]) for (const sd of [-1, 1]) B.cyl(x, 0.45, sd * 0.86, 0.45, 0.28, RED);
      });
      // the wagons: one body, three meshes, each placed every frame from where the locomotive is drawn
      const Wg = KIT.parts(), x0 = -K.BF, xm = -(K.BF + K.BL / 2), x1 = -(K.BF + K.BL);
      Wg.box(-0.35, 0.55, 0, 0.7, 0.12, 0.16, BLK); Wg.box(xm, 0.55, 0, K.BL, 0.25, K.BW, BLK);
      for (const sd of [-1, 1]) { Wg.box(xm, 0.95, sd * (K.BW / 2 - 0.03), K.BL, 0.55, 0.06, RED); Wg.box(xm, 1.24, sd * (K.BW / 2 - 0.03), K.BL, 0.06, 0.08, GLD); }
      for (const x of [x0, x1]) Wg.box(x, 1.1, 0, 0.06, 0.85, K.BW, DRED);
      for (const x of [x0 + 0.05, x1 - 0.05]) for (const sd of [-1, 1]) Wg.box(x, 1.75, sd * (K.BW / 2 - 0.05), 0.08, 1.3, 0.08, WHT);
      Wg.box(xm, 2.42, 0, K.BL + 0.3, 0.1, K.BW + 0.16, WHT); for (const sd of [-1, 1]) Wg.box(xm, 2.36, sd * (K.BW / 2 + 0.06), K.BL + 0.3, 0.14, 0.05, RED);
      for (let b = 0; b < 3; b++) for (const sd of [-1, 1]) for (const q of [0, 1]) {
        const x = -(K.BF + 0.7 + b * 1.3), z = sd * (0.25 + q * 0.42), k = b * 4 + (sd > 0 ? 2 : 0) + q;
        Wg.box(x, 1.12, z, 0.34, 0.5, 0.36, SHIRT[k % SHIRT.length]); Wg.box(x, 1.5, z, 0.24, 0.25, 0.24, SKIN[k % SKIN.length]);
      }
      for (const x of [-(K.BF + 0.8), -K.LW]) for (const sd of [-1, 1]) Wg.cyl(x, 0.36, sd * 0.86, 0.36, 0.24, BLK);
      const wGeo = KIT.merged(Wg.L), wMat = new THREE.MeshLambertMaterial({ vertexColors: true }), V = Render.viewOf ? Render.viewOf(P) : null;
      fx.wag = r.w.map((w, k) => {
        const m = new THREE.Mesh(wGeo, wMat); m.castShadow = true; m.frustumCulled = false; m.matrixAutoUpdate = false;
        m.onBeforeRender = () => this.place(r, V, m, k); this.place(r, V, m, k); r.add(m); return m;
      });
      // the beach by the seafront: parasols on the low ground on the sea's side of the road
      const pts = [], sea = this.seaSide(r, gh);
      for (let s = -K.PRE - 50; s <= 40 && pts.length < 36; s += 9) for (let e = 8; e <= 32 && pts.length < 36; e += 8) {
        const i = T.idx(T.startS + s), off = sea * (T.wS(T.startS + s) + e + ((s * 7 + e * 3) % 5) * 0.4), x = T.px[i] + T.nx[i] * off, z = T.pz[i] + T.nz[i] * off, g = gh(x, z);
        if (Number.isFinite(g) && g > 0.35 && g < 4.5 && Math.abs(g - (T.hy ? T.hy[i] : g)) < 3.5) pts.push([x, g, z]);
      }
      if (pts.length) {
        const pole = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.04, 0.04, 2.3, 5).translate(0, 1.15, 0), new THREE.MeshLambertMaterial({ color: 0xe8e2d6 }), pts.length);
        const top = new THREE.InstancedMesh(new THREE.ConeGeometry(1.25, 0.55, 8).translate(0, 2.25, 0), new THREE.MeshLambertMaterial({ color: 0xffffff }), pts.length);
        const M = new THREE.Matrix4(), col = new THREE.Color(), PC = [0xd6332a, 0x2f6fb0, 0xf2c230, 0x3a9a4a, 0xf2f2ee];
        pts.forEach(([x, y, z], k) => { M.makeRotationY(k * 1.7); M.setPosition(x, y, z); pole.setMatrixAt(k, M); top.setMatrixAt(k, M); top.setColorAt(k, col.setHex(PC[k % PC.length])); });
        for (const m of [pole, top]) { m.castShadow = true; r.add(m); }
        fx.beach = pts.length; fx.par = top;
      } else fx.beach = 0;
      // the viewpoint: a terrace over the slope on the low side of the road, its railing and a bench; the yellow box on the road
      const st = KIT.at(T, T.startS + K.STOP - 2, 0), lo = this.lowSide(r, gh), wS = T.wS(T.startS + K.STOP), B = KIT.parts(), R0 = 3.0, RR = R0 - 0.15;
      // (its local +x away from the road, over the slope: the railing on that half, the benches and the telescope facing it; a slab to the road)
      B.disc(0, 0, 0, R0, 0.3, 0xcfc6b4); B.disc(0, -3.2, 0, R0 - 0.1, 6, 0xb8ad98); B.box(-R0 - 0.1, 0.02, 0, 1.0, 0.26, 2.0, 0xcfc6b4);
      for (let a = 0; a <= 10; a++) { const t = -Math.PI / 2 + (a / 10) * Math.PI; B.box(Math.cos(t) * RR, 0.65, Math.sin(t) * RR, 0.08, 1.0, 0.08, 0x3a3d42); }
      for (let a = 0; a < 10; a++) { const t = -Math.PI / 2 + ((a + 0.5) / 10) * Math.PI; B.box(Math.cos(t) * RR, 1.12, Math.sin(t) * RR, 0.08, 0.06, RR * Math.PI / 10 + 0.06, 0x3a3d42, -t); }
      for (const z of [-1.1, 1.1]) B.box(0.3, 0.45, z, 0.45, 0.1, 1.2, 0x8a5a32);
      B.box(2.0, 0.75, 0, 0.12, 1.2, 0.12, 0x3a3d42); B.box(2.1, 1.4, 0, 0.5, 0.18, 0.18, 0x3a3d42);
      const tm = B.mesh(new THREE.MeshLambertMaterial({ vertexColors: true })), i0 = st.i, off = lo * (wS + R0 + 0.6);
      tm.position.set(T.px[i0] + T.nx[i0] * off, (T.hy ? T.hy[i0] : st.y) + 0.02, T.pz[i0] + T.nz[i0] * off); tm.rotation.y = Math.atan2(-T.nz[i0] * lo, T.nx[i0] * lo); tm.castShadow = true; r.add(tm);
      fx.view = tm; fx.lo = lo; fx.st = { x: T.px[i0] + T.nx[i0] * lo * (wS + 2), y: (T.hy ? T.hy[i0] : st.y), z: T.pz[i0] + T.nz[i0] * lo * (wS + 2) };
      const Y = KIT.parts(), Wb = wS - 0.5, o = KIT.at(T, T.startS + K.STOP, 0);
      for (const [ds, of, lx, lz] of [[-K.ZONE, 0, 2 * Wb, 0.45], [K.ZONE, 0, 2 * Wb, 0.45], [0, -Wb + 0.2, 0.3, 2 * K.ZONE], [0, Wb - 0.2, 0.3, 2 * K.ZONE]]) {
        const p = KIT.at(T, T.startS + K.STOP + ds, of), i = T.idx(T.startS + K.STOP + ds);
        Y.box(p.x - o.x, (T.hy ? T.hy[i] : p.y) + 0.05, p.z - o.z, lx, 0.02, lz, YL, Math.atan2(-T.nz[i], T.nx[i]));
      }
      const ym = Y.mesh(new THREE.MeshLambertMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 })); ym.position.set(o.x, 0, o.z); r.add(ym); fx.box = ym;
      r.tags = KIT.tags(r);
    },
    // the side of the road towards the sea at the start (the lower ground 40 m out), and the low side at the viewpoint
    seaSide(r, gh) { const T = r.race.track; let a = 0; for (let s = -K.PRE; s <= 0; s += 20) { const i = T.idx(T.startS + s); for (const sd of [-1, 1]) { const g = gh(T.px[i] + T.nx[i] * sd * 40, T.pz[i] + T.nz[i] * sd * 40); if (Number.isFinite(g)) a += sd * g; } } return a > 0 ? -1 : 1; },
    lowSide(r, gh) { const T = r.race.track, i = T.idx(T.startS + K.STOP); let a = 0; for (const e of [10, 16, 24]) for (const sd of [-1, 1]) { const g = gh(T.px[i] + T.nx[i] * sd * e, T.pz[i] + T.nz[i] * sd * e); if (Number.isFinite(g)) a += sd * g; } return a > 0 ? -1 : 1; },
    // a wagon placed from where the locomotive is drawn (its coupling) and the chain's angles from the physics
    place(r, V, m, k) {
      const P = r.P, g = V && V.grp, x = g ? g.position.x : P.x, y = g ? g.position.y : (P.y || 0), z = g ? g.position.z : P.z, h = g ? -g.rotation.y : P.h;
      let hx = x - Math.cos(h) * K.C0, hz = z - Math.sin(h) * K.C0, hh = h, prev = P.h;
      for (let j = 0; j <= k; j++) { const w = r.w[j]; hh += Math.atan2(Math.sin(w.h - prev), Math.cos(w.h - prev)); prev = w.h; if (j < k) { hx -= Math.cos(hh) * K.LC; hz -= Math.sin(hh) * K.LC; } }
      // (its coupling on the ground there, its axle on the ground under it: pitched on the slope; a jolt off the kerb)
      const w = r.w[k], W = Render.world, ax = hx - Math.cos(hh) * K.LW, az = hz - Math.sin(hh) * K.LW;
      const gy = (px, pz) => { const g = W && W.groundH ? W.groundH(px, pz) : NaN; return Number.isFinite(g) ? Math.max(g, y - 1.5) : y; };
      const yH = gy(hx, hz), yA = gy(ax, az);
      m.position.set(hx, yH + (w.j > 0 ? Math.sin(w.j * 40) * 0.06 * w.j : 0), hz); m.rotation.set(0, -hh, Math.asin(clamp((yH - yA) / K.LW, -0.3, 0.3)), 'YZX');
      m.updateMatrix(); m.matrixWorld.copy(m.matrix);
    },
    draw(r) {
      const fx = r.fx, P = r.P, C = Render.camera;
      if (r.tags) {
        const L = [], d = K.STOP - P.dist;
        if (r.pop) { const w = r.w[r.pop.k]; L.push(Object.assign(reach(C, w.hx - Math.cos(w.h) * 2.5, (P.y || 0) + 3.2, w.hz - Math.sin(w.h) * 2.5), { html: '<b>' + tr('ROBNIK!') + '</b>', cls: 'hot' })); }
        if (d > -K.PAST && d < 600) L.push(Object.assign(reach(C, fx.st.x, fx.st.y + 3.4, fx.st.z), { html: '<b>' + tr('RAZGLED') + '</b>' + (Math.abs(d) < K.ZONE ? tr('ustavi tukaj') : Math.round(Math.abs(d)) + ' m'), cls: Math.abs(d) < K.ZONE ? 'go' : '' }));
        r.tags.set(L);
      }
    },
  });
})();
