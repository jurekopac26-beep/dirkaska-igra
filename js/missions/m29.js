/* Special mission 29 · Božična noč · Štajerska, Avstrija (js/missions.js; the kit: js/missions/kit.js). Christmas night in the snow: the
   circuit in the hills passes four villages (V: their stretches, the sides with room for houses, the houses with lights), K.N houses with
   lights round the lap (the targets: a golden circle K.CIRC m past the road's edge before each door) among houses with lit windows. The
   pickup (MisKit.skin over the 4x4's physics, its own limiter K.VMAX) carries K.N presents. VRZI held: the longer, the further the present
   flies (K.DMIN .. K.DMAX m in K.HOLD s; a tap shorter than K.TAP s throws nothing); the game aims at the next house's circle (across the
   pickup's own speed: the dot always on the line to the circle), a dot on the snow shows where it lands; let go: it flies in an arc
   (K.FT0 + D·K.FTD s). In the circle (K.R m): a hit (ZADETKI V KROG); short or long it lies in the snow (long onto the house: in the
   window). A house left K.PASS m behind without its present is lost. The presents gone or no house left: K.NEED hits done (stars by
   the hits: all K.N 3, K.N - 2 2, else 1), fewer failed (also as soon as fewer can still come); midnight (the limit): failed. */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js');
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const fr = (x) => x - Math.floor(x);
  const K = { N: 12, NEED: 8, VMAX: 70, LIMIT: 300, FRONT: 6.0, CIRC: 3.2, CLEAR: 2.5, GAP: 30, SKIP: 22, R: 2.0, DMIN: 3, DMAX: 26, HOLD: 1.5, TAP: 0.12,
    FT0: 0.5, FTD: 0.025, BED: -1.3, RANGE: 70, BEHIND: 12, PASS: 25 };
  // the villages: [from, to] along the lap (m from the start line), the sides with room for houses (1 right, -1 left: the grandstands, the
  // pits and the fans' grass left out), the houses with lights [s, side]
  const V = [
    { a: 400, b: 870, sides: [1], t: [[480, 1], [650, 1], [820, 1]] },
    { a: 1360, b: 1960, sides: [1], t: [[1460, 1], [1650, 1], [1850, 1]] },
    { a: 2140, b: 2590, sides: [1, -1], t: [[2230, -1], [2390, 1], [2540, -1]] },
    { a: 2900, b: 3560, sides: [1, -1], t: [[3010, 1], [3220, -1], [3430, 1]] },
  ];
  const has3 = () => typeof THREE !== 'undefined' && typeof Render !== 'undefined' && !!Render.scene;
  const RED = 0xb5121b, DRED = 0x7e0c12, BLK = 0x1b1d21, GRY = 0x8f979f, GLS = 0x1d2733;
  const GIFT = [0x2f6fb0, 0x3a9a4a, 0xf2c230, 0xd6332a, 0x9a4ac4, 0xf2f2ee];
  const LIT = [[1, 0.2, 0.15], [0.2, 1, 0.3], [0.3, 0.5, 1], [1, 0.85, 0.2], [1, 1, 0.95]], GOLD = [1, 0.78, 0.25];
  // a tag's place for MisKit.tags: one farther than half the camera's reach pulled in along the line of sight (the same spot on the screen)
  const reach = (C, x, y, z) => { if (!C) return { x, y, z }; const dx = x - C.position.x, dy = y - C.position.y, dz = z - C.position.z, d = Math.hypot(dx, dy, dz), m = 0.5 * (C.far || 400); if (d <= m) return { x, y, z }; const k = m / d; return { x: C.position.x + dx * k, y: C.position.y + dy * k, z: C.position.z + dz * k }; };

  // the houses: in each village every K.GAP m on its sides with room, the houses with lights at their places (moved a little where there
  // is no room); none whose walls come within K.CLEAR m of a road's edge (the circuit doubles back on itself)
  function layout(T) {
    const out = [];
    const room = (x, z, m) => { const q = T.query(x, z, -1, {}); return Math.abs(q.d) - T.wS(q.s) >= m; };
    const mk = (s, side, tgt, k) => {
      const i = T.idx(s), w = T.wS(s), L = 10 + 2.6 * fr(k * 0.618), W = 8 + 1.2 * fr(k * 0.414), H = 3.4 + 0.6 * fr(k * 0.732);
      const off = side * (w + K.FRONT + W / 2), x = T.px[i] + T.nx[i] * off, z = T.pz[i] + T.nz[i] * off;
      const h = { s, side, tgt, k, x, z, L, W, H, tx: T.tx[i], tz: T.tz[i], ox: T.nx[i] * side, oz: T.nz[i] * side, got: false, gone: false };
      for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1]]) if (!room(x + h.tx * a * L / 2 + h.ox * b * W / 2, z + h.tz * a * L / 2 + h.oz * b * W / 2, K.CLEAR)) return null;
      if (tgt) { const c = side * (w + K.CIRC); h.cx = T.px[i] + T.nx[i] * c; h.cz = T.pz[i] + T.nz[i] * c; h.cy = T.hy ? T.hy[i] : 0; if (!room(h.cx, h.cz, 1.5)) return null; }
      return h;
    };
    let k = 0;
    for (const v of V) {
      const tg = [];
      for (const [s, side] of v.t) { let h = null; for (const d of [0, 12, -12, 24, -24, 36]) if ((h = mk(s + d, side, true, k++))) break; if (h) { tg.push(h); out.push(h); } }
      for (const side of v.sides) for (let s = v.a; s <= v.b; s += K.GAP) {
        if (tg.some(h => h.side === side && Math.abs(h.s - s) < K.SKIP)) continue;
        const h = mk(s, side, false, k++); if (h) out.push(h);
      }
    }
    return out;
  }

  Missions.add({
    id: '29', title: 'Božična noč', track: 'rbring', limit: K.LIMIT, stars: null, K, V, layout,
    story: 'Božična noč v zasneženih vaseh. Na kesonu je dvanajst daril.',
    goal: 'Med vožnjo vrzi darila v zlate kroge pred hišami z lučkami, preden odbije polnoč. Vsaj osem jih mora pristati v krogu.',
    hint: 'Vrzi darilo v zlati krog pred vrati, ne v okno.',
    rows: [{ k: 'tarca', label: 'TARČA' }, { k: 'darila', label: 'DARILA', bar: true, col: '#d6332a' }, { k: 'zad', label: 'ZADETKI V KROG', bar: true, col: '#ffd34d' }, { k: 'moc', label: 'MOČ', bar: true, col: '#ffb020' }],
    // alone on the circuit in the snow at night; the pickup: the 4x4's physics, its own limiter, no damage; one lap
    opts: () => ({ tt: true, laps: 1, playerModel: KIT.truckModel('medved', { vLim: K.VMAX }), playerColor: RED, damage: 0 }),
    begin(r) {
      const T = r.race.track;
      r.houses = layout(T); r.tg = r.houses.filter(h => h.tgt);
      r.gifts = K.N; r.hits = 0; r.lost = 0; r.hold = 0; r.fly = null; r.snow = []; r.msg = null; r.pop = null; r.down = false; r.press = false;
      if (typeof Render !== 'undefined' && Render.setAtmos) Render.setAtmos({ season: 'winter', tod: 'night' }, true);
      if (has3()) this.build(r);
      this.show(r);
    },
    // how far a house is ahead along the lap (the race's distance from the start line: the lap's end is not its start)
    ahead(r, h) { const P = r.P; return h.s - (P.dist != null ? P.dist : P.q.s); },
    // the house the presents go to now: the nearest not yet given one, from K.BEHIND m behind to K.RANGE m ahead
    target(r) { let b = null, ba = 1e9; for (const h of r.tg) if (!h.got && !h.gone) { const a = this.ahead(r, h); if (a > -K.BEHIND && a < K.RANGE && a < ba) { ba = a; b = h; } } return b; },
    next(r) { let b = null, ba = 1e9; for (const h of r.tg) if (!h.got && !h.gone) { const a = this.ahead(r, h); if (a > -K.BEHIND && a < ba) { ba = a; b = h; } } return b; },
    dist(hold) { return K.DMIN + (K.DMAX - K.DMIN) * clamp(hold / K.HOLD, 0, 1); },
    // where a present thrown now D m far lands: from the bed, on the line to the circle (aimed across the pickup's speed: thrown with it)
    aim(r, h, D) {
      const P = r.P, c = Math.cos(P.h || 0), sn = Math.sin(P.h || 0), bx = (P.x || 0) + c * K.BED, bz = (P.z || 0) + sn * K.BED;
      let wx = h.cx - bx, wz = h.cz - bz; const g = Math.hypot(wx, wz) || 1; wx /= g; wz /= g;
      const ft = K.FT0 + D * K.FTD, vx = P.vx || 0, vz = P.vz || 0, along = (vx * wx + vz * wz) * ft, side = (vx * vx + vz * vz) * ft * ft - along * along;
      const lam = along + Math.sqrt(Math.max(0, D * D - side));
      return { bx, bz, x: bx + wx * lam, z: bz + wz * lam, ft, lam, g, D };
    },
    // a landing on the house itself (its walls' square): in the window
    onHouse(h, x, z) { const dx = x - h.x, dz = z - h.z; return Math.abs(dx * h.tx + dz * h.tz) < h.L / 2 + 0.3 && Math.abs(dx * h.ox + dz * h.oz) < h.W / 2 + 0.3; },
    throwAt(r, h) {
      const A = this.aim(r, h, this.dist(r.hold)), e = Math.hypot(A.x - h.cx, A.z - h.cz);
      const res = e < K.R ? 'hit' : this.onHouse(h, A.x, A.z) ? 'okno' : A.lam < A.g ? 'short' : 'long';
      r.fly = { h, res, k: K.N - r.gifts, t: 0, ft: A.ft, x0: A.bx, z0: A.bz, y0: (r.P.y || 0) + 1.5, x1: A.x, z1: A.z, y1: null, D: A.D };
      r.gifts--;
    },
    land(r, f) {
      r.snow.push(f); r.fly = null;
      if (f.res === 'hit') { f.h.got = true; r.hits++; r.pop = { h: f.h, t: 1.6 }; r.msg = ['Zadetek! Darilo je pred vrati.', 2]; }
      else r.msg = [f.res === 'okno' ? 'V okno! Meri v zlati krog pred vrati.' : f.res === 'short' ? 'Prekratko: darilo je obležalo v snegu.' : 'Predolgo: darilo je obležalo v snegu.', 2.5];
    },
    // the end: the presents gone or no house left (or the lap done): enough hits done, the stars by the hits
    done(r) {
      if (r.fly) this.land(r, r.fly);
      this.show(r);
      if (r.hits >= K.NEED) { r.win(); r.stars = r.hits >= K.N ? 3 : r.hits >= K.N - 2 ? 2 : 1; }
      else r.fail(tr('Premalo daril je pristalo v zlatih krogih.'));
    },
    step(r, dt) {
      const P = r.P, q = P.q; if (!q) return;
      P.wrongT = 0;
      if (r.t >= K.LIMIT) { this.show(r); r.fail(tr('Odbila je polnoč, preden so bila darila raznesena.')); return; }
      // the houses passed without their present
      for (const h of r.tg) if (!h.got && !h.gone && this.ahead(r, h) < -K.PASS) { h.gone = true; r.lost++; r.msg = ['Hišo si zgrešil: ostala je brez darila.', 2.5]; }
      const tg = this.target(r);
      // the button: held, the power grows (none while a present flies); let go, the present flies to the target; no target, no throw
      const down = !!(r.down || r.press) && !!tg && r.gifts > 0 && !r.fly;
      if (down) r.hold += dt;
      else if (r.hold > 0) { if (r.hold >= K.TAP && tg && r.gifts > 0 && !r.fly) this.throwAt(r, tg); else if (tg) r.msg = ['Drži VRZI dlje: dlje držiš, dlje leti.', 2]; r.hold = 0; }
      if (r.fly) { r.fly.t += dt; if (r.fly.t >= r.fly.ft) this.land(r, r.fly); }
      if (r.msg && (r.msg[1] -= dt) <= 0) r.msg = null;
      if (r.pop && (r.pop.t -= dt) <= 0) r.pop = null;
      // the end
      const open = r.tg.filter(h => !h.got && !h.gone).length;
      if (!r.fly && (r.gifts <= 0 || open === 0)) { this.done(r); return; }
      if (!r.fly && r.hits + Math.min(r.gifts, open) < K.NEED) { this.show(r); r.fail(tr('Premalo daril je pristalo v zlatih krogih.')); return; }
      r.tgNow = tg;
      if (r.hold > 0 && tg) { const A = this.aim(r, tg, this.dist(r.hold)); r.dot = A; r.dotIn = Math.hypot(A.x - tg.cx, A.z - tg.cz) < K.R; } else { r.dot = null; r.dotIn = false; }
      r.say(r.msg ? r.msg[0] : r.dot ? (r.dotIn ? 'Spusti! Pika je v krogu.' : r.dot.lam < r.dot.g ? 'Drži še: pika mora v zlati krog.' : 'Predaleč: spusti prej.')
        : tg ? 'Drži VRZI: dlje držiš, dlje leti. Spusti, ko je pika v krogu.' : 'Pelji do naslednje hiše z lučkami.');
      if (r.fx) this.draw(r, dt);
      this.show(r);
    },
    finish(r) { this.done(r); },
    show(r) {
      const tg = r.tgNow, nx = tg || (r.tg ? this.next(r) : null);
      const d = tg ? Math.hypot(tg.cx - (r.P.x || 0), tg.cz - (r.P.z || 0)) : nx ? this.ahead(r, nx) : null;
      r.set('tarca', d == null ? '—' : Math.max(0, Math.round(d)) + ' m', null, tg && d < K.DMAX ? '#ffd34d' : null);
      r.set('darila', r.gifts + ' / ' + K.N, r.gifts / K.N, r.gifts + r.hits < K.NEED + 1 ? '#e8452c' : null);
      r.set('zad', r.hits + ' / ' + K.N, r.hits / K.N, r.hits >= K.NEED ? '#3fbf6a' : null);
      const p = clamp(r.hold / K.HOLD, 0, 1);
      r.set('moc', r.hold > 0 ? Math.round(p * 100) + ' %' : '—', r.hold > 0 ? p : 0, r.dotIn ? '#3fbf6a' : null);
      if (r.btn) r.btn.show(!!tg && r.gifts > 0 && !r.end);
    },
    // the tests' and the pictures' driver: round the lap on the side of the next house with lights, VRZI held from K.DMAX m and let go when
    // the dot is nearest the circle's middle (o.late s later: long; o.skip: the houses (their order) it drives past; o.never: no throws)
    pilot(r, o) {
      o = Object.assign({ v: 15, late: 0, skip: [], never: false }, o);
      const P = r.P, T = r.race.track; if (!P.q) return [0, 0, 1];
      const nx = this.next(r), a = KIT.pilot(P, T, { dir: 1, v: o.v, lat: 4, off: nx ? nx.side * 3 : 0 });
      const tg = this.target(r);
      if (!tg || r.gifts <= 0 || r.fly || o.never || o.skip.includes(r.tg.indexOf(tg))) { r.press = false; r.lateT = null; return a; }
      if (r.hold > 0) {
        const err = (hd) => { const A = this.aim(r, tg, this.dist(hd)); return Math.hypot(A.x - tg.cx, A.z - tg.cz); };
        if (r.lateT != null) { r.lateT -= 1 / 60; r.press = r.lateT > 0; }
        else if (err(r.hold + 1 / 60) > err(r.hold) && (err(r.hold) < K.R || r.hold > K.HOLD)) { if (o.late > 0) { r.lateT = o.late; r.press = true; } else r.press = false; }
        else r.press = true;
      } else { r.lateT = null; r.press = Math.hypot(tg.cx - P.x, tg.cz - P.z) < K.DMAX - 2; }
      return a;
    },

    /* ---------------- the look: the villages, the lights, the circles, the presents, the pickup ---------------- */
    build(r) {
      const T = r.race.track, fx = r.fx = {}, W = Render.world;
      const gy = (x, z, i) => { const g = W && W.groundH ? W.groundH(x, z) : NaN; return Number.isFinite(g) ? g : (T.hy ? T.hy[i] : 0); };
      const B = KIT.parts(), Wn = KIT.parts(), M4 = () => new THREE.Matrix4(), v3 = new THREE.Vector3();
      const box = (L, H, x, y, z, lx, ly, lz, c) => L.L.push({ g: new THREE.BoxGeometry(lx, ly, lz), m: H.clone().multiply(M4().makeTranslation(x, y, z)), c });
      const pts = [], pcol = [], pk = [];   // (the lights: their places, colours, which house: -1 a tree)
      const light = (H, x, y, z, hk) => { v3.set(x, y, z).applyMatrix4(H); pts.push(v3.x, v3.y, v3.z); pk.push(hk); pcol.push(1, 1, 1); };
      // the houses: walls white below and wood above, the snowy roof, a chimney, the door and its lamp, lit windows; the lights on the ones
      // with a circle along the eaves and the gables facing the road
      r.houses.forEach((h, j) => {
        const i = T.idx(h.s); let lo = 1e9, hi = -1e9;
        for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const y = gy(h.x + h.tx * a * h.L / 2 + h.ox * b * h.W / 2, h.z + h.tz * a * h.L / 2 + h.oz * b * h.W / 2, i); lo = Math.min(lo, y); hi = Math.max(hi, y); }
        const y0 = lo - 0.4, Hw = hi - y0 + h.H, yf = gy(h.x - h.ox * h.W / 2, h.z - h.oz * h.W / 2, i) - y0;
        const H = M4().makeRotationY(Math.atan2(-h.tz, h.tx) + (h.side > 0 ? Math.PI : 0)); H.setPosition(h.x, y0, h.z);
        const wall = h.k % 3 ? 0xeee6d6 : 0xe6dccb, wood = h.k % 2 ? 0x6b4428 : 0x5a3a24;
        box(B, H, 0, Hw / 2, 0, h.L, Hw, h.W, wall);
        box(B, H, 0, Hw - 0.85, 0, h.L + 0.06, 1.7, h.W + 0.06, wood);
        B.L.push({ g: KIT.prism(h.L + 1.0, h.W + 1.2, 2.8), m: H.clone().multiply(M4().makeTranslation(0, Hw, 0)), c: 0xdfe6ee });
        box(B, H, h.L * 0.27, Hw + 2.2, -h.W * 0.18, 0.6, 1.8, 0.6, 0x8a8178);
        box(B, H, 0, yf + 1.05, h.W / 2 + 0.03, 1.1, 2.1, 0.06, 0x4a2e1c);
        box(Wn, H, 0, yf + 2.45, h.W / 2 + 0.14, 0.26, 0.26, 0.22, 0xfff0c0);
        for (const x of [-0.32, 0.32]) box(Wn, H, x * h.L, yf + 1.55, h.W / 2 + 0.03, 1.15, 1.0, 0.05, 0xffc46a);
        for (const sx of [-1, 1]) box(Wn, H, sx * (h.L / 2 + 0.03), yf + 1.55, 0.6, 0.05, 1.0, 1.1, 0xffb85a);
        box(Wn, H, 0, Hw - 0.9, h.W / 2 + 0.07, 1.6, 0.8, 0.05, 0xffc46a);
        if (h.tgt) {
          const a = (h.L + 1.0) / 2, e = (h.W + 1.2) / 2 - 0.05, hk = r.tg.indexOf(h);
          for (let x = -a; x <= a + 1e-6; x += 0.45) light(H, x, Hw - 0.08, e, hk);
          for (const sx of [-1, 1]) for (let u = 0.08; u < 1; u += 0.1) light(H, sx * a, Hw - 0.05 + 2.8 * u, e * (1 - u), hk);
        }
      });
      // a Christmas tree with lights by the first house with lights of each village (on the road's other side when it has room)
      V.forEach((v) => {
        const h = r.tg.find(x => x.s >= v.a - 40 && x.s <= v.b + 40); if (!h) return;
        const s = h.s + 16, i = T.idx(s), side = v.sides.includes(-h.side) ? -h.side : h.side, off = side * (T.wS(s) + 5.5), x = T.px[i] + T.nx[i] * off, z = T.pz[i] + T.nz[i] * off, y = gy(x, z, i);
        const H = M4().makeTranslation(x, y, z);
        box(B, H, 0, 0.6, 0, 0.5, 1.2, 0.5, 0x4a3020);
        for (const [y1, r1, h1] of [[1.0, 2.6, 3.0], [2.6, 2.0, 2.6], [4.0, 1.35, 2.3]]) B.L.push({ g: new THREE.ConeGeometry(r1, h1, 8), m: H.clone().multiply(M4().makeTranslation(0, y1 + h1 / 2, 0)), c: 0x1d4a2c });
        box(Wn, H, 0, 6.5, 0, 0.45, 0.45, 0.12, 0xffe680);
        for (let u = 0; u < 1; u += 0.025) { const yy = 1.1 + 5.0 * u, rr = 2.5 * (1 - u) + 0.15, an = u * 6.283 * 5; light(H, Math.cos(an) * rr, yy, Math.sin(an) * rr, -1); }
      });
      const body = B.mesh(new THREE.MeshLambertMaterial({ vertexColors: true })); body.castShadow = true; body.receiveShadow = true; r.add(body);
      const win = Wn.mesh(new THREE.MeshBasicMaterial({ vertexColors: true })); r.add(win);
      fx.body = body; fx.win = win;
      // the lights (one draw): round glowing dots
      const c = document.createElement('canvas'); c.width = c.height = 32; const g2 = c.getContext('2d'), gr = g2.createRadialGradient(16, 16, 0, 16, 16, 16);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, 32, 32);
      const dotTex = new THREE.CanvasTexture(c);
      const LG = new THREE.BufferGeometry(); LG.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); LG.setAttribute('color', new THREE.Float32BufferAttribute(pcol, 3));
      fx.lights = new THREE.Points(LG, new THREE.PointsMaterial({ size: 0.9, sizeAttenuation: true, vertexColors: true, map: dotTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
      fx.lights.frustumCulled = false; r.add(fx.lights); fx.pk = pk; fx.blink = -1;
      // the snow falling round the camera (one draw)
      const NF = 600, SP = fx.snowP = new Float32Array(NF * 3); for (let k = 0; k < NF; k++) { SP[k * 3] = fr(k * 0.618) * 70 - 35; SP[k * 3 + 1] = fr(k * 0.414) * 26; SP[k * 3 + 2] = fr(k * 0.732) * 70 - 35; }
      const SG = new THREE.BufferGeometry(); SG.setAttribute('position', new THREE.BufferAttribute(SP, 3));
      fx.flakes = new THREE.Points(SG, new THREE.PointsMaterial({ color: 0xf4f8ff, size: 0.2, map: dotTex, transparent: true, opacity: 0.85, depthWrite: false }));
      fx.flakes.frustumCulled = false; r.add(fx.flakes);
      // the golden circles (a pool of 3), the dot where the present lands and its arc
      const ringG = new THREE.RingGeometry(K.R - 0.32, K.R, 40);
      fx.rings = [0, 1, 2].map(() => { const m = new THREE.Mesh(ringG, new THREE.MeshBasicMaterial({ color: 0xffd34d, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6, fog: false })); m.rotation.x = -Math.PI / 2; m.visible = false; m.renderOrder = 2; r.add(m); return m; });
      fx.dot = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.85, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8, fog: false }));
      fx.dot.rotation.x = -Math.PI / 2; fx.dot.visible = false; fx.dot.renderOrder = 3; r.add(fx.dot);
      fx.arcP = new Float32Array(16 * 3); const AG = new THREE.BufferGeometry(); AG.setAttribute('position', new THREE.BufferAttribute(fx.arcP, 3));
      fx.arc = new THREE.Points(AG, new THREE.PointsMaterial({ size: 0.4, sizeAttenuation: true, color: 0xffffff, map: dotTex, transparent: true, depthWrite: false, fog: false }));
      fx.arc.frustumCulled = false; fx.arc.visible = false; r.add(fx.arc);
      // the presents: the box and its ribbon, K.N in the world (flying, lying in the snow or in a circle) and K.N on the pickup's bed
      const RB = KIT.parts(); RB.box(0, 0, 0, 0.48, 0.4, 0.1, 0xffd23a); RB.box(0, 0, 0, 0.1, 0.4, 0.48, 0xffd23a); RB.box(0, 0.24, 0, 0.2, 0.1, 0.2, 0xffd23a);
      const ribG = KIT.merged(RB.L), boxG = new THREE.BoxGeometry(0.46, 0.38, 0.46), Z = M4().makeScale(0, 0, 0), col = new THREE.Color();
      const gifts = () => {
        const b = new THREE.InstancedMesh(boxG, new THREE.MeshLambertMaterial({ color: 0xffffff }), K.N), rb = new THREE.InstancedMesh(ribG, new THREE.MeshLambertMaterial({ vertexColors: true }), K.N);
        for (let k = 0; k < K.N; k++) { b.setMatrixAt(k, Z); rb.setMatrixAt(k, Z); b.setColorAt(k, col.setHex(GIFT[k % GIFT.length])); }
        b.frustumCulled = rb.frustumCulled = false; return [b, rb];
      };
      fx.gw = gifts(); for (const m of fx.gw) r.add(m);
      fx.lie = 0;
      // the pickup: the cab in front, the bed behind it with the presents in it (x forward, y up, z to the side)
      r.skin = KIT.skin(r, r.P, (S) => {
        S.box(0, 0.78, 0, 4.8, 0.5, 1.94, RED); S.box(0.62, 1.42, 0, 1.75, 0.82, 1.84, RED); S.box(1.95, 1.06, 0, 1.2, 0.08, 1.9, RED);
        S.box(1.5, 1.5, 0, 0.04, 0.62, 1.66, GLS); S.box(0.62, 1.55, 0.93, 1.35, 0.5, 0.02, GLS); S.box(0.62, 1.55, -0.93, 1.35, 0.5, 0.02, GLS); S.box(-0.27, 1.55, 0, 0.04, 0.5, 1.6, GLS);
        S.box(-1.25, 1.06, 0, 2.25, 0.06, 1.84, 0x2a2c30); S.box(-1.25, 1.28, 0.92, 2.25, 0.42, 0.06, RED); S.box(-1.25, 1.28, -0.92, 2.25, 0.42, 0.06, RED); S.box(-2.38, 1.28, 0, 0.06, 0.42, 1.84, DRED);
        S.box(2.43, 0.62, 0, 0.1, 0.2, 1.96, GRY); S.box(-2.43, 0.62, 0, 0.1, 0.2, 1.96, GRY); S.box(0.62, 1.85, 0, 0.5, 0.06, 1.2, 0xe8e8e8);
        S.box(2.42, 0.95, 0.72, 0.04, 0.16, 0.3, 0xfff4cc); S.box(2.42, 0.95, -0.72, 0.04, 0.16, 0.3, 0xfff4cc); S.box(-2.42, 0.98, 0.78, 0.04, 0.18, 0.22, 0xff3a2a); S.box(-2.42, 0.98, -0.78, 0.04, 0.18, 0.22, 0xff3a2a);
        for (const x of [1.55, -1.45]) for (const sd of [-1, 1]) S.cyl(x, 0.42, sd * 0.88, 0.42, 0.32, BLK);
      });
      if (r.skin) {
        fx.gb = gifts(); const M = M4();
        for (let k = 0; k < K.N; k++) { M.makeRotationY((k * 0.7) % 0.5 - 0.25); M.setPosition(-0.45 - 0.55 * (k % 4), 1.28, -0.56 + 0.56 * Math.floor(k / 4)); fx.gb[0].setMatrixAt(k, M); fx.gb[1].setMatrixAt(k, M); }
        for (const m of fx.gb) { m.instanceMatrix.needsUpdate = true; r.skin.add(m); }
        const v = Render.viewOf(r.P); if (v && v.lights && v.lights.length >= 4) { v.lights[0].set(2.45, 0.95, -0.72); v.lights[1].set(2.45, 0.95, 0.72); v.lights[2].set(-2.45, 0.98, -0.78); v.lights[3].set(-2.45, 0.98, 0.78); }
      }
      // the circles' heights on the snow, the button, the tags
      for (const h of r.tg) h.cy = gy(h.cx, h.cz, T.idx(h.s));
      r.btn = KIT.button(r, 'VRZI');
      if (r.btn.el) {
        const b = r.btn.el, up = () => { r.down = false; };
        b.classList.add('red'); b.addEventListener('pointerdown', () => { r.down = true; }); for (const e of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(e, up);
      }
      r.tags = KIT.tags(r);
    },
    draw(r, dt) {
      const fx = r.fx, P = r.P, C = Render.camera, W = Render.world, T = r.race.track, M = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e3 = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1), p3 = new THREE.Vector3();
      const gy = (x, z, y) => { const g = W && W.groundH ? W.groundH(x, z) : NaN; return Number.isFinite(g) ? g : y; };
      // the lights: blinking in turn (a house given its present: all of them golden)
      const ph = Math.floor(r.t / 0.5);
      if (ph !== fx.blink) {
        fx.blink = ph; const A = fx.lights.geometry.attributes.color;
        for (let k = 0; k < fx.pk.length; k++) { const hk = fx.pk[k], c = hk >= 0 && r.tg[hk].got ? GOLD : LIT[(k + ph) % LIT.length]; A.array[k * 3] = c[0]; A.array[k * 3 + 1] = c[1]; A.array[k * 3 + 2] = c[2]; }
        A.needsUpdate = true;
      }
      // the snow: falling slowly, drifting, round the camera
      if (C) { const A = fx.snowP; fx.flakes.position.set(C.position.x, C.position.y - 10, C.position.z);
        for (let k = 0; k < A.length; k += 3) { A[k + 1] -= dt * 1.4; A[k] += dt * (0.5 + 0.4 * Math.sin(r.t + k)); if (A[k + 1] < 0) A[k + 1] += 26; if (A[k] > 35) A[k] -= 70; }
        fx.flakes.geometry.attributes.position.needsUpdate = true; }
      // the circles before the next houses with lights (the one the presents go to now brighter; a hit one green a moment)
      const open = r.tg.filter(h => (!h.got || (r.pop && r.pop.h === h)) && !h.gone && this.ahead(r, h) > -K.BEHIND && this.ahead(r, h) < 260).slice(0, 3);
      fx.rings.forEach((m, k) => {
        const h = open[k]; m.visible = !!h; if (!h) return;
        m.position.set(h.cx, h.cy + 0.08, h.cz);
        const hit = h.got; m.material.color.setHex(hit ? 0x3fbf6a : 0xffd34d);
        m.material.opacity = hit ? clamp(r.pop.t / 1.6, 0, 1) : (h === r.tgNow ? 0.65 + 0.3 * Math.abs(Math.sin(r.t * 4)) : 0.45);
      });
      // the dot and the arc while VRZI is held
      const D = r.dot, tg = r.tgNow;
      fx.dot.visible = fx.arc.visible = !!(D && tg);
      if (D && tg) {
        const y1 = gy(D.x, D.z, tg.cy), y0 = (P.y || 0) + 1.5, hm = 1.2 + 0.1 * D.D;
        fx.dot.position.set(D.x, y1 + 0.1, D.z); fx.dot.material.color.setHex(r.dotIn ? 0x7dff9a : 0xffffff);
        for (let j = 0; j < 16; j++) { const u = (j + 1) / 17; fx.arcP[j * 3] = D.bx + (D.x - D.bx) * u; fx.arcP[j * 3 + 1] = y0 + (y1 - y0) * u + 4 * hm * u * (1 - u); fx.arcP[j * 3 + 2] = D.bz + (D.z - D.bz) * u; }
        fx.arc.geometry.attributes.position.needsUpdate = true;
      }
      // the presents: on the bed the ones not thrown yet, in the air the one flying, in the snow and in the circles the ones landed
      if (fx.gb) { const Z = M.makeScale(0, 0, 0); const thrown = K.N - r.gifts; for (let k = 0; k < thrown; k++) { fx.gb[0].setMatrixAt(k, Z); fx.gb[1].setMatrixAt(k, Z); } fx.gb[0].instanceMatrix.needsUpdate = fx.gb[1].instanceMatrix.needsUpdate = true; }
      const put = (k, x, y, z, a, b) => { M.compose(p3.set(x, y, z), q4.setFromEuler(e3.set(a, b, a * 0.6)), one); fx.gw[0].setMatrixAt(k, M); fx.gw[1].setMatrixAt(k, M); };
      for (const f of r.snow) { if (f.y1 == null) f.y1 = gy(f.x1, f.z1, f.h.cy); put(f.k, f.x1, f.y1 + 0.19, f.z1, 0, f.k * 1.3); }
      if (r.fly) { const f = r.fly; if (f.y1 == null) f.y1 = gy(f.x1, f.z1, f.h.cy); const u = clamp(f.t / f.ft, 0, 1), hm = 1.2 + 0.1 * f.D; put(f.k, f.x0 + (f.x1 - f.x0) * u, f.y0 + (f.y1 + 0.19 - f.y0) * u + 4 * hm * u * (1 - u), f.z0 + (f.z1 - f.z0) * u, u * 7, u * 5); }
      fx.gw[0].instanceMatrix.needsUpdate = fx.gw[1].instanceMatrix.needsUpdate = true;
      // the tags: the house the presents go to (or the next one), where it lands while held, a hit
      if (r.tags) {
        const L = [], nx = tg || this.next(r);
        if (r.pop) L.push(Object.assign(reach(C, r.pop.h.cx, r.pop.h.cy + 3, r.pop.h.cz), { html: '<b>+1</b>' + tr('ZADETEK'), cls: 'go' }));
        else if (D && tg) L.push(Object.assign(reach(C, D.x, gy(D.x, D.z, tg.cy) + 1.6, D.z), { html: '<b>' + tr('TU PADE') + '</b>' + Math.round(D.D) + ' m', cls: r.dotIn ? 'go' : '' }));
        else if (nx) { const d = Math.max(0, Math.round(tg ? Math.hypot(nx.cx - (P.x || 0), nx.cz - (P.z || 0)) : this.ahead(r, nx))); if (d < 600) L.push(Object.assign(reach(C, nx.cx, (nx.cy || 0) + 3.2, nx.cz), { html: '<b>' + tr('HIŠA Z LUČKAMI') + '</b>' + d + ' m', cls: tg ? 'go' : '' })); }
        r.tags.set(L);
      }
    },
  });
})();
