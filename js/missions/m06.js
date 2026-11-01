/* Special mission 06 · Srce v hladilni torbi · Santa Monica Mountains, ZDA (js/missions.js). At night a heart for a transplant goes over the
   hills in a sports car behind a patrol car: the escort leads with its lights and siren, the traffic (cars, vans and trucks only, nobody
   on foot, no bicycles: opts.tfCars) pulls over to the edge and stops for it (Traffic._yield), the oncoming one on its own edge. The organ
   warms up as the time goes by, faster after a hard knock and while the escort is far ahead; at 8 °C it is lost. The escort waits for
   the player (its pace, skCap, by the gap: ESC); left more than 300 m behind for 8 s, the mission is lost. Over the finish at the top:
   the hospital, done: a low white building beside the road just past the line (lit windows, a blue H, no red cross), its car park and
   an ambulance waiting at its door with its lights flashing (hospital(): a few simple bodies, ~10 draw calls). */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s), dec = (s) => (typeof Lang !== 'undefined' ? Lang.dec(s) : String(s));
  // the organ: from T0 °C, up RISE °C a second (at 8 °C after 250 s: the escort's own pace takes ~140 s), HIT °C a hard knock (an impact over 3), FAR °C a second more with the escort over 150 m
  // ahead; lost at TMAX. The escort: its pace by the gap to the player (m ahead of the player): GAP0..GAP1 its own, beyond GAP1 slower
  // down to SLOW, under GAP0 (or the player ahead of it) quicker
  const K = { T0: 4.0, TMAX: 8.0, RISE: 0.016, HIT: 0.25, FAR: 0.02, FARGAP: 150, GAP0: 25, GAP1: 70, SLOW: 0.45, LOST: 300, LOSTT: 8 };
  const ESC_PACE = 1.0;
  // a canvas painted by fn as a texture
  function tex(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.anisotropy = 2; return t; }
  // the hospital at the finish: beside the road on its roomier side, 10 m past the line, facing the road
  function hospital(r) {
    const T = r.race.track, s = T.finishS + 12, i = T.idx(s), side = T.br[i] >= T.bl[i] ? 1 : -1, w = T.wS(s);
    const W = (typeof Render !== 'undefined' && Render.world) || {}, gy = (x, z) => (W.groundH ? W.groundH(x, z) : T.hy[i]) || T.hy[i];
    const at = (along, off) => { const j = T.idx(s + along); return [T.px[j] + T.nx[j] * off * side, T.pz[j] + T.nz[j] * off * side]; };
    const g = new THREE.Group(), rot = Math.atan2(-T.tz[i], T.tx[i]), face = Math.atan2(-side * T.nx[i], -side * T.nz[i]);   // (rot: a box's length along the road; face: a plane's front toward the road)
    const lam = (c) => new THREE.MeshLambertMaterial({ color: c }), bas = (c, map) => new THREE.MeshBasicMaterial({ color: c, map: map || null });
    const box = (x, z, y, L, H, D, m) => { const o = new THREE.Mesh(new THREE.BoxGeometry(L, H, D), m); o.position.set(x, y + H / 2, z); o.rotation.y = rot; g.add(o); return o; };
    // the car park: a grey slab between the road and the building
    { const [x, z] = at(0, w + 8); const y = Math.max(gy(x, z), T.hy[i]) + 0.04; box(x, z, y - 0.3, 34, 0.3, 12, lam(0x6d737a)); }
    // the building: two floors, 30 m along the road, 12 m deep; the windows lit all round its front, a flat roof
    const [bx, bz] = at(0, w + 20), by = Math.max(gy(bx, bz), T.hy[i]) - 0.2;
    box(bx, bz, by, 30, 7.2, 12, lam(0xe4e7ea));
    box(bx, bz, by + 7.2, 30.6, 0.5, 12.6, lam(0x9aa3ad));
    const winT = tex(256, 64, (c, W2, H2) => { c.fillStyle = '#3b4552'; c.fillRect(0, 0, W2, H2); c.fillStyle = '#ffe2a0'; for (let k = 0; k < 16; k++) { c.fillRect(4 + k * 16, 6, 10, 20); if (k !== 7 && k !== 8) c.fillRect(4 + k * 16, 38, 10, 20); } });
    const [fx, fz] = at(0, w + 13.95); const front = new THREE.Mesh(new THREE.PlaneGeometry(29, 6), bas(0xffffff, winT)); front.position.set(fx, by + 3.5, fz); front.rotation.y = face; g.add(front);
    // the door and its canopy, the sign: a white H on blue on a post, lit
    const [dx, dz] = at(0, w + 13.4); box(dx, dz, by + 3.2, 6, 0.3, 2.2, lam(0xc9ced4));
    const hT = tex(64, 64, (c) => { c.fillStyle = '#1d5fd1'; c.fillRect(0, 0, 64, 64); c.fillStyle = '#fff'; c.font = 'bold 50px Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('H', 32, 35); });
    const [hx, hz] = at(-13, w + 2.5), hy = Math.max(gy(hx, hz), T.hy[i]); box(hx, hz, hy, 0.25, 4, 0.25, lam(0x8a929c));
    const sign = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 0.3), [bas(0x1d5fd1), bas(0x1d5fd1), bas(0x1d5fd1), bas(0x1d5fd1), bas(0xffffff, hT), bas(0xffffff, hT)]);
    sign.position.set(hx, hy + 5, hz); sign.rotation.y = face; g.add(sign);
    // the ambulance at the door: white, a red band, its light bar flashing (step)
    const [ax, az] = at(3, w + 9), ay = Math.max(gy(ax, az), T.hy[i]);
    box(ax, az, ay + 0.35, 5.6, 2.3, 2.1, lam(0xf4f5f7));
    box(ax, az, ay + 1.0, 5.64, 0.3, 2.14, lam(0xd8282a));
    const l0 = bas(0x5aa0ff), l1 = bas(0x10204a); r.amb = [l0, l1];
    const [qx, qz] = at(3 + 1.6, w + 9.5), [px2, pz2] = at(3 + 1.6, w + 8.5);
    box(qx, qz, ay + 2.65, 0.4, 0.25, 0.9, l0); box(px2, pz2, ay + 2.65, 0.4, 0.25, 0.9, l1);
    r.add(g); r.hosp = g;
  }

  Missions.add({
    id: '06', title: 'Srce v hladilni torbi', track: 'mulholland', car: 'jelen', stars: [165, 205], K,
    story: 'Ponoči moraš čez hribe pripeljati srce za presaditev. Pred tabo vozi policija.',
    goal: 'Za policijo dostavi organ v bolnišnico, dokler je hladen.',
    hint: 'Drži se policije: avti pred njo zapeljejo na rob in ustavijo.',
    rows: [{ k: 'organ', label: 'ORGAN', bar: true }, { k: 'esc', label: 'SPREMSTVO', bar: true, col: '#4a8cff' }, { k: 'hosp', label: 'BOLNIŠNICA' }],
    // alone with the escort ahead on the open road, in the traffic (cars and trucks), dry, at night
    opts: () => ({ tt: false, numAI: 1, playerGrid: 2, traffic: true, tfCars: [0.62, 0.2, 0, 0, 0.18], playerColor: 0xc8202a }),
    // the rival of the duel becomes the escort: a patrol car (VORTEX, white) in its place, with its lights and siren
    made(race) {
      const k = race.cars.findIndex(c => !c.isPlayer); if (k < 0) return;
      const o = race.cars[k], M = Core.MODELS.find(m => m.id === 'vortex');
      const c = new Core.Car(M, { id: o.id, name: 'POLICIJA', color: 0xf2f4f6, skill: 1.05, assist: Core.CSK.aiAssist, phys: race.opts.phys });
      c.place(o.x, o.z, o.h); c.y = c.py = o.y; c.roadY = o.roadY; c.q = o.q; c.sPrev = o.sPrev; c.dist = o.dist; c.grid = o.grid; c.num = 0; c.dmgMode = 0; c.locked = o.locked; c.laneBias = 0;
      c.police = true; c.pol = { mode: 'chase', kind: 'car', t: 0 }; c.skCap = ESC_PACE; c.rubber = 1;
      race.cars[k] = c; race.escort = c;
    },
    begin(r) {
      r.temp = K.T0; r.lostT = 0; r.esc = r.race.escort || null;
      if (typeof Render !== 'undefined' && Render.setAtmos) Render.setAtmos({ season: 'summer', tod: 'night' }, true);
      if (typeof THREE !== 'undefined') hospital(r);
      this.show(r);
    },
    step(r, dt) {
      const P = r.P, E = r.esc, T = r.race.track;
      const gap = E ? E.dist - P.dist : 0;
      // the escort's pace by the gap: waits for the player, never lets the player lose it by going too fast
      if (E) E.skCap = gap > K.GAP1 ? Math.max(K.SLOW, ESC_PACE - (gap - K.GAP1) / 120) : gap < K.GAP0 ? ESC_PACE + 0.12 : ESC_PACE;
      // the organ warms up
      const imp = Math.max(P.hitWall || 0, P.hitCar || 0);
      r.temp += K.RISE * dt + (imp > 3 && !(r.hitT > 0) ? K.HIT : 0) + (gap > K.FARGAP ? K.FAR * dt : 0);
      if (imp > 3) r.hitT = 0.6; else if (r.hitT > 0) r.hitT -= dt;
      if (r.temp >= K.TMAX) { r.temp = K.TMAX; r.fail(tr('Organ se je preveč segrel.')); }
      // left behind
      if (gap > K.LOST) { r.lostT += dt; if (r.lostT > K.LOSTT) r.fail(tr('Izgubil si spremstvo.')); } else r.lostT = 0;
      r.say(gap > K.GAP1 * 1.6 ? 'Policija je daleč: dohiti jo, da ti odpira pot.' : gap < -10 ? 'Ne prehitevaj policije: promet se umika samo njej.' : this.hint);
      if (r.amb) { const on = (r.t * 1.6) % 1 < 0.5; r.amb[0].color.setHex(on ? 0x5aa0ff : 0x10204a); r.amb[1].color.setHex(on ? 0x10204a : 0x5aa0ff); }   // (the ambulance's lamps, one side then the other)
      r.gap = gap; r.toGo = Math.max(0, (T.raceLen || T.len) - Math.max(0, P.dist));
      this.show(r);
    },
    show(r) {
      const f = (K.TMAX - r.temp) / (K.TMAX - K.T0);
      r.set('organ', dec(r.temp.toFixed(1)) + ' °C', f, f > 0.5 ? '#3fbf6a' : f > 0.25 ? '#ffb020' : '#e8452c');
      const g = Math.max(0, r.gap || 0);
      r.set('esc', Math.round(g) + ' m', 1 - Math.min(1, g / K.LOST));
      const T = r.race.track, left = r.toGo != null ? r.toGo : (T.raceLen || T.len);
      r.set('hosp', dec((left / 1000).toFixed(1)) + ' km');
    },
  });
})();
