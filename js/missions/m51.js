/* Special mission 51 · Dinozaver na tovornjaku · Crystal Palace, Anglija (js/missions.js; the kit: js/missions/kit.js). A statue of a
   stegosaurus goes back to the park after its repair, on a low-loader (MisKit.skin over the racing truck's physics, 14 m, its own limiter):
   one lap of the park's road to the finish line. Its height is the limit: the statue's plates stand K.HI m over the road (VIŠINA TOVORA);
   SPUSTI PODVOZJE lowers the trailer to K.LO m (and slows it to K.VLO km/h; DVIGNI PODVOZJE raises it back). The low railway bridge
   (K.BRIDGE m past the line, K.BH m under it) passes only lowered; under the trees (K.TREES) the branches hang lower towards the edges
   (their clearance branchAt(|d|): K.B0 m over the middle, K.BK m less for each metre aside), so it goes down the middle; parked cars (K.CARS)
   narrow the road (a knock: MisKit.block). Each hit costs the statue (DINOZAVER): branches K.HB, a parked car K.HC; into the bridge raised:
   failed at once. PROSTOR: the room over the statue at the next low thing ahead. */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js');
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s);
  const dec = (s) => (typeof Lang !== 'undefined' && Lang.dec ? Lang.dec(s) : String(s).replace('.', ','));
  const K = { HI: 4.6, LO: 4.2, VMAX: 45, VLO: 15, BRIDGE: 1150, BH: 4.35, B0: 5.25, BK: 0.366, HALF: 0.6, TREES: [550, 1655, 2200, 2660], TL: 44,
    CARS: [[960, 1], [990, 1], [1030, 1], [1310, -1], [1345, -1], [2590, 1], [2625, 1]], HB: 0.25, HC: 0.2, HIT: 1.5, AHEAD: 140 };
  const GRN = 0x5d7a52, DGRN = 0x3f5a3a, BED = 0x2b2e33, CAB = 0xd8642a, GLS = 0x1d2733, BLK = 0x1b1d21, GRY = 0x9aa1a8;
  // the branches' clearance at x m from the middle of the road
  const branchAt = (x) => K.B0 - K.BK * x;

  // the tractor and the low bed (x forward, y up, z to the side): the cab in front, the bed 0.9 m over the road, the rear bogie
  function lowLoader(B) {
    B.box(5.3, 1.9, 0, 2.3, 2.5, 2.5, CAB); B.box(6.46, 2.3, 0, 0.04, 0.9, 2.2, GLS); B.box(5.0, 3.25, 0, 1.6, 0.25, 2.3, 0xe07a40);
    B.box(3.6, 1.15, 0, 1.4, 0.5, 2.0, BED); B.box(2.6, 1.35, 0, 1.2, 0.5, 2.5, BED);
    B.box(-1.6, 0.7, 0, 8.6, 0.32, 2.55, BED); B.box(-1.6, 0.9, 1.24, 8.6, 0.1, 0.08, 0xf2c12e); B.box(-1.6, 0.9, -1.24, 8.6, 0.1, 0.08, 0xf2c12e);
    for (const x of [5.6, 3.9, 3.0]) for (const sd of [-1, 1]) B.cyl(x, 0.52, sd * 1.05, 0.52, 0.4, BLK);
    for (const x of [-4.4, -5.3, -6.2]) for (const sd of [-1, 1]) B.cyl(x, 0.4, sd * 1.0, 0.4, 0.36, BLK);
    B.box(-6.7, 0.95, 0.9, 0.04, 0.2, 0.3, 0xff3a2a); B.box(-6.7, 0.95, -0.9, 0.04, 0.2, 0.3, 0xff3a2a);
    B.box(6.48, 1.0, 0.9, 0.04, 0.22, 0.4, 0xfff4cc); B.box(6.48, 1.0, -0.9, 0.04, 0.22, 0.4, 0xfff4cc);
  }
  // the stegosaurus on the bed (its own mesh: it goes down with the bed): the body, the legs, the neck and head, the tail with its
  // spikes, the plates along the back (the tallest K.HI m over the road)
  function dino(B) {
    const y0 = 0.86;
    B.box(-1.6, y0 + 1.75, 0, 4.6, 1.5, 1.7, GRN); B.box(-1.4, y0 + 2.45, 0, 3.0, 0.5, 1.2, GRN);
    for (const x of [0.2, -3.3]) for (const sd of [-1, 1]) B.box(x, y0 + 0.55, sd * 0.55, 0.5, 1.1, 0.45, DGRN);
    B.box(1.4, y0 + 1.5, 0, 1.4, 0.7, 0.8, GRN); B.box(2.35, y0 + 1.25, 0, 0.8, 0.5, 0.55, GRN);
    B.box(-4.6, y0 + 1.75, 0, 1.8, 0.7, 0.8, GRN); B.box(-5.9, y0 + 1.6, 0, 1.2, 0.4, 0.45, GRN);
    for (const sd of [-1, 1]) B.box(-6.3, y0 + 1.85, sd * 0.35, 0.12, 0.7, 0.1, 0xe8e2c8);
    const P = [[0.4, 0.55], [-0.4, 0.75], [-1.2, 0.95], [-2.0, 0.95], [-2.8, 0.75], [-3.6, 0.55], [-4.3, 0.4]];
    P.forEach(([x, hgt], k) => B.box(x, K.HI - hgt / 2 - (0.95 - hgt), (k % 2 ? 0.16 : -0.16), 0.6, hgt, 0.1, 0xb8743a));
  }
  // the railway bridge: the deck K.BH m over the road, its beams, the abutments by the road's edges and the parapets
  function bridge(T, s) {
    const i = T.idx(s), w = T.wS(s) + 1.2, B = KIT.parts();
    B.box(0, K.BH + 0.55, 0, 7.0, 1.1, 2 * w + 3, 0x6d5a4a); B.box(0, K.BH + 0.04, 0, 6.6, 0.08, 2 * w + 3, 0x3a3e44);
    B.box(0, K.BH + 1.5, 0, 0.3, 0.8, 2 * w + 3, 0x5a4a3c); B.box(-3.3, K.BH + 1.5, 0, 0.3, 0.8, 2 * w + 3, 0x5a4a3c); B.box(3.3, K.BH + 1.5, 0, 0.3, 0.8, 2 * w + 3, 0x5a4a3c);
    for (const sd of [-1, 1]) B.box(0, (K.BH + 1.1) / 2 - 0.5, sd * (w + 1.2), 8.0, K.BH + 2.1, 2.4, 0x7a6655);
    B.box(0, K.BH + 2.0, -w - 2.6, 0.5, 0.5, 0.5, 0xffffff);
    const g = new THREE.Group(); g.add(B.mesh(new THREE.MeshLambertMaterial({ vertexColors: true })));
    g.position.set(T.px[i], T.hy[i], T.pz[i]); g.rotation.y = -Math.atan2(T.tz[i], T.tx[i]);
    return g;
  }
  // the trees over the road at s0 (K.TL m of them): the trunks by the edges, the crowns, the branches sloping up from the edges to the
  // middle (their underside branchAt(|d|) over the road)
  function trees(T, s0) {
    const B = KIT.parts(), g = new THREE.Group(), i0 = T.idx(s0), a0 = Math.atan2(T.tz[i0], T.tx[i0]), M = new THREE.Matrix4(), R = new THREE.Matrix4();
    for (let u = -K.TL / 2; u <= K.TL / 2; u += 11) {
      const i = T.idx(s0 + u), w = T.wS(s0 + u), dx = T.px[i] - T.px[i0], dz = T.pz[i] - T.pz[i0], dy = T.hy[i] - T.hy[i0];
      const lx = dx * Math.cos(a0) + dz * Math.sin(a0), lz = -dx * Math.sin(a0) + dz * Math.cos(a0), ra = Math.atan2(T.tz[i], T.tx[i]) - a0;
      for (const sd of [-1, 1]) {
        const tz = sd * (w + 2.4), cx = lx - Math.sin(ra) * tz, cz = lz + Math.cos(ra) * tz;
        B.box(cx, dy + 2.6, cz, 0.6, 5.2, 0.6, 0x5a4636); B.box(cx, dy + 7.4, cz, 4.0, 4.2, 4.0, u % 22 ? DGRN : 0x4a6a3a);
        // (a branch: a slab from over the edge to near the middle, its underside rising from branchAt(w) to branchAt(0.5))
        const x0 = w + 1.6, x1 = 0.5, h0 = branchAt(x0), h1 = branchAt(x1), L = Math.hypot(x0 - x1, h0 - h1), mid = (x0 + x1) / 2, th = 0.45;
        const tilt = Math.atan2(h1 - h0, x0 - x1) * sd;
        R.makeRotationX(tilt); M.makeRotationY(-ra).multiply(R);
        const bz = sd * mid; M.setPosition(lx - Math.sin(ra) * bz, dy + (h0 + h1) / 2 + th / 2, lz + Math.cos(ra) * bz);
        B.L.push({ g: new THREE.BoxGeometry(10.6, th, L), m: M.clone(), c: 0x4f6e40 });
      }
    }
    g.add(B.mesh(new THREE.MeshLambertMaterial({ vertexColors: true })));
    g.position.set(T.px[i0], T.hy[i0], T.pz[i0]); g.rotation.y = -a0;
    return g;
  }
  // the parked cars (one mesh): a car's body and its glass, by the edge of the road
  function parked(T, list) {
    const B = KIT.parts(), cols = [0x2a5ab8, 0xd8282a, 0xeeeeee, 0x30343a, 0x3a7a4a, 0xc9b38a, 0x8a1c2c];
    const i0 = T.idx(list[0].s), x0 = T.px[i0], z0 = T.pz[i0], y0 = T.hy[i0];
    list.forEach((c, k) => { const ry = -c.h;
      const M = new THREE.Matrix4().makeRotationY(ry); M.setPosition(c.x - x0, c.y - y0 + 0.7, c.z - z0); B.L.push({ g: new THREE.BoxGeometry(c.L, 0.9, c.W), m: M, c: cols[k % cols.length] });
      const M2 = new THREE.Matrix4().makeRotationY(ry); M2.setPosition(c.x - x0, c.y - y0 + 1.35, c.z - z0); B.L.push({ g: new THREE.BoxGeometry(c.L * 0.55, 0.5, c.W * 0.9), m: M2, c: GLS }); });
    const g = new THREE.Group(); g.add(B.mesh(new THREE.MeshLambertMaterial({ vertexColors: true }))); g.position.set(x0, y0, z0);
    return g;
  }

  Missions.add({
    id: '51', title: 'Dinozaver na tovornjaku', track: 'cpalace', limit: 480, stars: [280, 360], K, branchAt,
    story: 'Kip dinozavra se po obnovi vrača v park. Ulice so ozke, nad njimi veje in železniški most.',
    goal: 'Pripelji dinozavra v park, ne da zadene veje ali most. Pred mostom spusti podvozje.',
    hint: 'Pred mostom spusti podvozje, pod vejami pelji po sredini ceste.',
    rows: [{ k: 'visina', label: 'VIŠINA TOVORA' }, { k: 'prostor', label: 'PROSTOR' }, { k: 'dino', label: 'DINOZAVER', bar: true }],
    // one lap alone by day; the low-loader: the racing truck's physics, 14 m, slow
    opts: () => ({ tt: true, laps: 1, playerModel: KIT.truckModel('titan', { vLim: K.VMAX, kw: 380, len: 14.0, wid: 2.55, mass: 18000 }), playerColor: CAB, damage: 0 }),
    begin(r) {
      const T = r.race.track;
      r.low = false; r.hp = 1; r.inB = false; r.inC = false; r.H = K.HI; r.drop = 0;
      r.cars = K.CARS.map(([s, sd]) => { const i = T.idx(T.startS + s), off = sd * (T.wS(T.startS + s) - 1.1); return { s: T.startS + s, x: T.px[i] + T.nx[i] * off, z: T.pz[i] + T.nz[i] * off, y: T.hy[i], h: Math.atan2(T.tz[i], T.tx[i]), L: 4.4, W: 1.8 }; });
      if (typeof THREE !== 'undefined' && typeof document !== 'undefined') {
        r.skin = KIT.skin(r, r.P, lowLoader);
        if (r.skin) { const B = KIT.parts(); dino(B); r.dino = B.mesh(new THREE.MeshLambertMaterial({ vertexColors: true })); r.dino.castShadow = true; r.skin.add(r.dino);
          const v = Render.viewOf(r.P); if (v && v.lights && v.lights.length >= 4) { v.lights[0].set(6.5, 1.0, -0.9); v.lights[1].set(6.5, 1.0, 0.9); v.lights[2].set(-6.72, 0.95, -0.9); v.lights[3].set(-6.72, 0.95, 0.9); } }
        r.add(bridge(T, T.startS + K.BRIDGE));
        for (const s of K.TREES) r.add(trees(T, T.startS + s));
        r.add(parked(T, r.cars));
        r.tags = KIT.tags(r);
        r.btn = KIT.button(r, 'SPUSTI PODVOZJE'); r.btn.show(true);
      }
      this.show(r, null);
    },
    // the next low thing ahead (within K.AHEAD m, or under it now): { kind, s, room } (room over the statue at the truck's place across)
    next(r, q) {
      const T = r.race.track, s = q.s, x = Math.abs(q.d) + K.HALF; let best = null;
      const sB = T.startS + K.BRIDGE; if (sB - s > -6 && sB - s < K.AHEAD) best = { kind: 'most', s: sB, room: K.BH - r.H };
      for (const t of K.TREES) { const s0 = T.startS + t; if (s0 + K.TL / 2 - s > 0 && s0 - K.TL / 2 - s < K.AHEAD && (!best || s0 - K.TL / 2 < best.s)) best = { kind: 'veje', s: s0 - K.TL / 2, s1: s0 + K.TL / 2, room: branchAt(x) - r.H }; }
      return best;
    },
    step(r, dt) {
      const P = r.P, T = r.race.track, q = P.q; if (!q) return;
      // the bed down or up (the press of the button); lowered: slow
      if ((r.btn && r.btn.take()) || r.toggle) { r.toggle = false; r.low = !r.low; if (r.btn) r.btn.label(r.low ? 'DVIGNI PODVOZJE' : 'SPUSTI PODVOZJE'); }
      r.drop += ((r.low ? 1 : 0) - r.drop) * Math.min(1, dt * 2.5);
      r.H = K.HI - (K.HI - K.LO) * r.drop;
      P.m.vLim = r.low ? K.VLO : K.VMAX;
      if (r.dino) r.dino.position.y = -(K.HI - r.H);
      // the bridge: raised into it, failed; lowered under it, fine
      const sB = T.startS + K.BRIDGE, front = 7, back = 7;
      if (q.s + front > sB - 3.5 && q.s - back < sB + 3.5 && r.H > K.BH - 0.02) { r.fail(tr('Dinozaver je zadel železniški most.')); this.show(r, null); return; }
      // the branches: the statue's top at the truck's place across against their underside there
      let inB = false;
      for (const t of K.TREES) { const s0 = T.startS + t; if (q.s + front > s0 - K.TL / 2 && q.s - back < s0 + K.TL / 2 && branchAt(Math.abs(q.d) + K.HALF) < r.H) inB = true; }
      if (inB && !r.inB) { r.hp -= K.HB; r.hitT = 1.2; }
      r.inB = inB;
      // the parked cars
      let knock = 0; for (const c of r.cars) if (Math.abs(c.s - q.s) < 14) knock = Math.max(knock, KIT.block(P, c));
      if (knock > K.HIT && !r.inC) { r.hp -= K.HC; r.hitT = 1.2; }
      r.inC = knock > 0.05;
      if (r.hitT > 0) r.hitT -= dt;
      if (r.hp <= 0.001) { r.hp = 0; r.fail(tr('Dinozaver je preveč poškodovan.')); this.show(r, null); return; }
      const nx = this.next(r, q);
      if (r.tags) {
        const L = []; if (nx && nx.kind === 'most' && nx.s - q.s < 120 && nx.s - q.s > 0) { const i = T.idx(nx.s); L.push({ x: T.px[i], y: T.hy[i] + K.BH + 2.4, z: T.pz[i], html: '<b>' + dec(K.BH.toFixed(2)) + ' m</b>' + tr('železniški most'), cls: r.H < K.BH ? 'go' : '' }); }
        r.tags.set(L);
      }
      r.say(r.hitT > 0 ? (inB ? 'Veje! Pelji po sredini ceste.' : 'Pazi na parkirane avte.') : nx && nx.kind === 'most' && !r.low ? 'Most je prenizek: spusti podvozje.' : nx && nx.kind === 'veje' && nx.room < 0.2 ? 'Pod vejami pelji po sredini ceste.' : r.low && !nx ? 'Mimo nizkih ovir: dvigni podvozje, da hitreje pelješ.' : this.hint);
      this.show(r, nx);
    },
    show(r, nx) {
      r.set('visina', dec(r.H.toFixed(1)) + ' m' + (r.low ? ' ↓' : ''));
      if (!nx) r.set('prostor', '—');
      else { const v = nx.room; r.set('prostor', (v >= 0 ? '+' : '−') + dec(Math.abs(v).toFixed(2)) + ' m ' + tr(nx.kind === 'most' ? 'POD MOSTOM' : 'VEJE')); }
      r.set('dino', Math.round(r.hp * 100) + ' %', r.hp, r.hp > 0.6 ? '#3fbf6a' : r.hp > 0.3 ? '#ffb020' : '#e8452c');
    },
  });
})();
