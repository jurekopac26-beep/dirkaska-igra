/* Special mission 08 · Izgubljeni v gozdu · Ouninpohja, Finska (js/missions.js; the kit: js/missions/kit.js). At night three hikers got
   lost in the forest along the gravel road. The pickup (MisKit.skin over MEDVED's physics) has a searchlight on its roof, turned with a
   second finger (MisKit.aim on the ground, the driving controls kept: the pad over the road): its pool of light where the finger points
   (K.NEAR to K.FAR m from the pickup), the beam from the lamp to it. The thermal camera (TERMOKAMERA, a small window under the panel)
   looks where the searchlight looks: the hikers glow orange in it (warm stones and animals purple), so the player knows where to turn
   it. A hiker in the pool for K.LIT s is found: they walk out to the road and wait at its edge; the pickup stopped by them (K.PICK m,
   slower than K.STOP m/s) takes them in the back. All three in: on to the rescuers at the forest road's junction (K.BASE m past the
   start line): done there. BATERIJA ŽAROMETA runs down while it shines (the further, the faster): empty before the rescuers: failed. */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js');
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s);
  // the hikers: [s m past the start line, the side (1: the normal's), m out from the road's edge]
  const K = { HIK: [[1250, 1, 24], [2650, -1, 32], [3900, 1, 20]], BASE: 4700, NEAR: 8, FAR: 60, POOL: 6.5, LIT: 1.5, WALK: 1.7, PICK: 9, STOP: 1.5, BAT: 0.16, BATF: 0.12, FOV: 0.55, SEE: 130 };
  const RED = 0x9e2a22, DRD = 0x6e1a15, BLK = 0x1b1d21, GRY = 0x8f979f, GLS = 0x1d2733;
  const JACKET = [0xff8a1e, 0x2fb6ff, 0xffd21e];

  // the pickup: the cab, the bed behind it, the light bar and the searchlight's base on the roof (x forward, y up, z to the side)
  function pickup(B) {
    B.box(0.9, 0.95, 0, 2.2, 0.75, 1.95, RED); B.box(0.35, 1.65, 0, 1.75, 0.7, 1.85, RED); B.box(0.35, 2.02, 0, 1.7, 0.05, 1.8, DRD);
    B.box(1.24, 1.62, 0, 0.04, 0.55, 1.65, GLS); for (const sd of [-1, 1]) B.box(0.35, 1.65, sd * 0.93, 1.5, 0.48, 0.02, GLS);
    B.box(-1.55, 0.85, 0, 2.1, 0.55, 1.95, RED); B.box(-1.55, 0.62, 0, 2.0, 0.08, 1.75, BLK);
    for (const sd of [-1, 1]) B.box(-1.55, 1.18, sd * 0.94, 2.1, 0.12, 0.08, DRD);
    B.box(0.3, 2.1, 0, 0.5, 0.1, 1.5, GRY); B.box(0.3, 2.2, 0, 0.3, 0.12, 0.3, BLK);
    for (const x of [1.35, -1.45]) for (const sd of [-1, 1]) B.cyl(x, 0.42, sd * 0.86, 0.42, 0.32, BLK);
    B.box(2.01, 0.95, 0.7, 0.04, 0.18, 0.32, 0xfff4cc); B.box(2.01, 0.95, -0.7, 0.04, 0.18, 0.32, 0xfff4cc);
  }
  // a radial glow for the pool of light (one canvas, shared)
  let glowT = null;
  function glowTex() {
    if (glowT) return glowT;
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), G = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    G.addColorStop(0, 'rgba(255,248,226,1)'); G.addColorStop(0.55, 'rgba(255,240,205,.55)'); G.addColorStop(1, 'rgba(255,240,205,0)');
    g.fillStyle = G; g.fillRect(0, 0, 64, 64); return (glowT = new THREE.CanvasTexture(c));
  }
  // the searchlight's head (turns with the beam), the pool on the ground, the beam from the lamp to it (three draws)
  function lamp(r) {
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, 0.36), new THREE.MeshLambertMaterial({ color: 0x2a2d31 }));
    const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.24), new THREE.MeshBasicMaterial({ color: 0xfff6dc })); lens.rotation.y = Math.PI / 2; lens.position.x = 0.215; head.add(lens);
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex(), transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
    pool.rotation.x = -Math.PI / 2; pool.renderOrder = 2; pool.frustumCulled = false;
    const cg = new THREE.CylinderGeometry(0.15, 1, 1, 16, 1, true); cg.translate(0, -0.5, 0); cg.rotateX(-Math.PI / 2);   // (its tip at the origin, along +z to 1)
    const beam = new THREE.Mesh(cg, new THREE.MeshBasicMaterial({ color: 0xfff1cc, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    beam.frustumCulled = false; beam.renderOrder = 2;
    r.add(pool); r.add(beam);
    return { head, pool, beam };
  }

  Missions.add({
    id: '08', title: 'Izgubljeni v gozdu', track: 'ouninpohja', limit: 600, stars: [380, 470], K,
    story: 'Trije pohodniki so se ponoči izgubili v gozdu ob makadamski cesti.',
    goal: 'Z žarometom in termokamero najdi pohodnike in jih pripelji do reševalcev.',
    hint: 'Obračaj žaromet; pohodniki svetijo na termokameri.',
    rows: [{ k: 'najdeni', label: 'NAJDENI' }, { k: 'baterija', label: 'BATERIJA ŽAROMETA', bar: true, col: '#ffc21a' }],
    // alone on the closed gravel road at night; the pickup: MEDVED's physics, no damage
    opts: () => ({ tt: true, playerModel: KIT.truckModel('medved', { vLim: 95, len: 5.0, wid: 2.0 }), playerColor: RED, damage: 0 }),
    begin(r) {
      const T = r.race.track, W = typeof Render !== 'undefined' && Render.world;
      r.bat = 100; r.found = 0; r.aboard = 0; r.yaw = r.P.h || 0; r.dist = 20; r.tgt = null; r.thT = 0;
      // the hikers: where they stand in the forest, where they come out to the road
      r.h = K.HIK.map(([s, sd, off], k) => {
        const S = T.startS + s, i = T.idx(S), o = sd * (T.wS(S) + off), x = T.px[i] + T.nx[i] * o, z = T.pz[i] + T.nz[i] * o;
        const gh = W && W.groundH ? W.groundH(x, z) : NaN, ro = sd * (T.wS(S) + 1.2);
        return { k, s: S, x, z, y: Number.isFinite(gh) ? gh : T.hy[i], rx: T.px[i] + T.nx[i] * ro, rz: T.pz[i] + T.nz[i] * ro, ry: T.hy[i], st: 'lost', lit: 0, ry0: Math.atan2(T.tz[i], T.tx[i]) };
      });
      r.base = T.startS + K.BASE;
      if (typeof Render !== 'undefined' && Render.setAtmos) Render.setAtmos({ season: 'autumn', tod: 'night' }, true);
      if (typeof THREE !== 'undefined' && typeof document !== 'undefined') {
        r.skin = KIT.skin(r, r.P, pickup);
        r.L = lamp(r); if (r.skin) { r.L.head.position.set(0.3, 2.42, 0); r.skin.add(r.L.head); }
        r.ppl = KIT.crowd(r, 3);
        for (const h of r.h) r.ppl.put(h.k, h.x, h.y - 0.28, h.z, h.ry0, 0x3a3f46);
        r.tags = KIT.tags(r);
        r.aim = KIT.aim(r, { plane: 'g', drive: true, button: false, focus: new THREE.Vector3(r.P.x, T.hy[T.idx(T.startS)], r.P.z) });
        r.aim.on(true);
        // the rescuers at the junction: an ambulance's lamps, a tag
        const bi = T.idx(r.base), bo = T.wS(r.base) + 4; r.bp = { x: T.px[bi] + T.nx[bi] * bo, y: T.hy[bi], z: T.pz[bi] + T.nz[bi] * bo };
        const B = KIT.parts(); B.box(0, 1.3, 0, 5.6, 2.3, 2.2, 0xf2f4f6); B.box(0, 0.8, 0, 5.62, 0.3, 2.22, 0xd8282a); B.box(2.0, 2.55, 0, 0.3, 0.15, 1.4, 0x2a5fd8);
        for (const x of [1.8, -1.8]) for (const sd of [-1, 1]) B.cyl(x, 0.4, sd * 0.95, 0.4, 0.3, BLK);
        const amb = B.mesh(new THREE.MeshLambertMaterial({ vertexColors: true })); amb.position.set(r.bp.x, r.bp.y, r.bp.z); amb.rotation.y = -Math.atan2(T.tz[bi], T.tx[bi]); r.add(amb);
      }
      this.show(r);
    },
    // the searchlight's aim: the finger's point on the ground (kept K.NEAR..K.FAR m out), else straight ahead; in the tests at the nearest hiker
    aimAt(r) {
      const P = r.P, T = r.race.track;
      let p = null;
      if (r.autoAim) { let bd = 1e9; for (const h of r.h) if (h.st === 'lost') { const d = Math.hypot(h.x - P.x, h.z - P.z); if (d < bd && d < K.FAR + 20) { bd = d; p = h; } } }
      else if (r.aim && r.aim.touched && r.aim.point) p = r.aim.point;
      if (r.aim && r.aim.o.focus) { const f = r.aim.o.focus; f.set(P.x + Math.cos(P.h) * 20, T.hy[T.idx(P.q.s)], P.z + Math.sin(P.h) * 20); }
      if (!p) return { yaw: P.h || 0, d: 20 };
      return { yaw: Math.atan2(p.z - P.z, p.x - P.x), d: Math.max(K.NEAR, Math.min(K.FAR, Math.hypot(p.x - P.x, p.z - P.z))) };
    },
    step(r, dt) {
      const P = r.P, T = r.race.track, q = P.q; if (!q) return;
      const v = Math.hypot(P.vx || 0, P.vz || 0);
      // the searchlight turns toward its aim (not at once: its motor)
      const a = this.aimAt(r); let dy = a.yaw - r.yaw; while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI;
      r.yaw += Math.max(-2.5 * dt, Math.min(2.5 * dt, dy)); r.dist += (a.d - r.dist) * Math.min(1, dt * 4);
      const px = P.x + Math.cos(r.yaw) * r.dist, pz = P.z + Math.sin(r.yaw) * r.dist;
      r.tgt = { x: px, z: pz };
      r.bat -= (K.BAT + K.BATF * r.dist / K.FAR) * dt;
      // the hikers: found in the light, out to the road, in the back when the pickup stops by them
      for (const h of r.h) {
        if (h.st === 'lost') { if (Math.hypot(h.x - px, h.z - pz) < K.POOL) { h.lit += dt; if (h.lit >= K.LIT) { h.st = 'walk'; r.found++; } } else h.lit = Math.max(0, h.lit - dt * 0.5); }
        else if (h.st === 'walk' || h.st === 'wait') {
          const dx = h.rx - h.x, dz = h.rz - h.z, d = Math.hypot(dx, dz);
          if (d > 0.3) { const m = Math.min(d, K.WALK * dt); h.x += dx / d * m; h.z += dz / d * m; h.y += (h.ry - h.y) * Math.min(1, m / Math.max(0.3, d)); } else h.st = 'wait';
          if (Math.hypot(P.x - h.x, P.z - h.z) < K.PICK && v < K.STOP && h.st === 'wait') { h.st = 'in'; r.aboard++; if (r.ppl) r.ppl.hide(h.k); }
          else if (r.ppl) r.ppl.put(h.k, h.x, h.y - 0.28, h.z, Math.atan2(-(h.rz - h.z), h.rx - h.x) + Math.PI / 2, JACKET[h.k]);
        }
      }
      if (r.aboard >= 3 && q.s >= r.base) { r.win(); this.show(r); return; }
      if (r.bat <= 0) { r.bat = 0; this.show(r); r.fail(tr('Baterija žarometa se je izpraznila.')); return; }
      if (r.L) this.draw(r, px, pz);
      const wait = r.h.find(h => h.st === 'walk' || h.st === 'wait');
      if (wait) P.stuckT = 0;   // (stopped by a hiker on purpose: no Na progo)
      r.say(wait ? 'Pohodnik gre proti cesti: ustavi ob njem.' : r.aboard >= 3 ? 'Vsi so na avtu: pelji do reševalcev.' : this.hint);
      this.show(r);
    },
    // the searchlight, its pool and beam, the lit hikers, the thermal camera, the tags
    draw(r, px, pz) {
      const P = r.P, T = r.race.track, L = r.L, W = Render.world, gh = W && W.groundH ? W.groundH(px, pz) : NaN, gy = Number.isFinite(gh) ? gh : T.hy[T.idx(P.q.s)];
      const sz = 2 * K.POOL * (0.7 + 0.3 * r.dist / K.FAR);
      L.pool.position.set(px, gy + 0.15, pz); L.pool.scale.set(sz, sz, 1);
      L.head.rotation.y = -(r.yaw - P.h);
      const ly = (P.y || T.hy[T.idx(P.q.s)]) + 2.45, lx = P.x + Math.cos(P.h) * 0.3, lz = P.z + Math.sin(P.h) * 0.3, d = Math.hypot(px - lx, gy - ly, pz - lz);
      L.beam.position.set(lx, ly, lz); L.beam.lookAt(px, gy, pz); L.beam.scale.set(sz * 0.45, sz * 0.45, d);
      for (const h of r.h) if (h.st === 'lost' && r.ppl) r.ppl.put(h.k, h.x, h.y - 0.28, h.z, h.ry0, Math.hypot(h.x - px, h.z - pz) < K.POOL * 1.2 ? JACKET[h.k] : 0x3a3f46);
      const tg = [];
      for (const h of r.h) if (h.st === 'walk' || h.st === 'wait') tg.push({ x: h.x, y: h.y + 2.4, z: h.z, html: '<b>' + tr('POHODNIK') + '</b>' + tr('ustavi tu'), cls: 'go' });
      if (r.aboard >= 3 && r.bp) tg.push({ x: r.bp.x, y: r.bp.y + 4, z: r.bp.z, html: '<b>' + tr('REŠEVALCI') + '</b>', cls: 'go' });
      r.tags.set(tg);
      // the thermal camera's window at the top of the panel's rows (the panel is drawn after begin: added here)
      if (!r.thermo || !r.thermo.isConnected) { const rows = document.querySelector('#mis .mis-rows'); r.thermo = null;
        if (rows) { const box = document.createElement('div'); box.className = 'mis-thermo'; box.innerHTML = '<span>' + tr('TERMOKAMERA') + '</span><canvas width="160" height="96"></canvas>'; rows.insertBefore(box, rows.firstChild); r.thermo = box.querySelector('canvas'); } }
      if (r.thermo && r.t - r.thT > 0.1) { r.thT = r.t; this.thermal(r); }
    },
    // the thermal camera: what lies ahead of the searchlight within K.FOV rad each way, warm things as blobs (hikers orange, others purple)
    thermal(r) {
      const c = r.thermo, g = c.getContext('2d'), P = r.P, W = c.width, H = c.height;
      g.fillStyle = '#2a1648'; g.fillRect(0, 0, W, H);
      const put = (x, z, warm, k) => {
        let a = Math.atan2(z - P.z, x - P.x) - r.yaw; while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI;
        const d = Math.hypot(x - P.x, z - P.z); if (Math.abs(a) > K.FOV || d > K.SEE || d < 2) return;
        const cx = W / 2 - a / K.FOV * W / 2, s = Math.max(5, Math.min(40, 900 / d)), cy = H * 0.62;
        if (warm) { const G = g.createRadialGradient(cx, cy - s * 0.5, 1, cx, cy - s * 0.5, s); G.addColorStop(0, '#ffe27a'); G.addColorStop(0.45, '#ff8a1e'); G.addColorStop(1, 'rgba(255,60,30,0)');
          g.fillStyle = G; g.fillRect(cx - s, cy - s * 1.6, s * 2, s * 2.2); g.fillStyle = '#ffd36a'; g.fillRect(cx - s * 0.18, cy - s * 1.1, s * 0.36, s * 1.1); g.beginPath(); g.arc(cx, cy - s * 1.25, s * 0.17, 0, 6.283); g.fill(); }
        else { g.fillStyle = 'rgba(150,90,220,.5)'; g.beginPath(); g.arc(cx, cy - s * 0.2, s * 0.6, 0, 6.283); g.fill(); }
      };
      for (let k = 0; k < 14; k++) { const S = r.race.track.startS + 300 + k * 330, T = r.race.track, i = T.idx(S), o = (k % 2 ? 1 : -1) * (T.wS(S) + 14 + (k * 7) % 20); put(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, false); }
      for (const h of r.h) if (h.st !== 'in') put(h.x, h.z, true, h.k);
    },
    finish(r) { if (r.aboard >= 3) r.win(); else r.fail(tr('Mimo reševalcev brez vseh pohodnikov.')); },
    show(r) {
      r.set('najdeni', r.found + ' / 3');
      r.set('baterija', Math.round(r.bat) + ' %', r.bat / 100, r.bat < 20 ? '#e8452c' : '#ffc21a');
    },
    // the tests' and the pictures' driver: up the road, stopping by a hiker waiting at its edge (tools/misija-slika.mjs)
    pilot(r, o) {
      const P = r.P, T = r.race.track, a = KIT.pilot(P, T, Object.assign({ dir: 1, v: 14, lat: 3 }, o)), v = Math.hypot(P.vx, P.vz);
      r.autoAim = true;   // (the searchlight at the nearest hiker, as a finger would)
      const h = r.h.find(x => x.st === 'walk' || x.st === 'wait');
      if (h) { const ahead = h.s - P.q.s; if (ahead > -8 && ahead < 90) { if (ahead < 1.5) return [a[0], 0, 1]; const vt = Math.min(12, (ahead - 1) * 0.35); return [a[0], v < vt - 0.5 ? 0.5 : 0, v > vt + 0.5 ? 0.7 : 0]; } }
      return a;
    },
  });
})();
