/* Special mission 06 · Srce v hladilni torbi · Santa Monica Mountains, ZDA (js/missions.js). At night a heart for a transplant goes over the
   hills in a sports car behind a patrol car: the escort leads with its lights and siren, the traffic (cars, vans and trucks only, nobody
   on foot, no bicycles: opts.tfCars) pulls over to the edge and stops for it (Traffic._yield), the oncoming one on its own edge. The organ
   warms up as the time goes by, faster after a hard knock and while the escort is far ahead; at 8 °C it is lost. The escort waits for
   the player (its pace, skCap, by the gap: ESC); left more than 300 m behind for 8 s, the mission is lost. Over the finish at the top:
   the hospital, done: a low white building beside the road just past the line (lit windows, a blue H, no red cross), its car park and
   an ambulance waiting at its door with its lights flashing (MisKit.hospital: a few simple bodies, ~10 draw calls). */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js');
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s), dec = (s) => (typeof Lang !== 'undefined' ? Lang.dec(s) : String(s));
  // the organ: from T0 °C, up RISE °C a second (at 8 °C after 250 s: the escort's own pace takes ~140 s), HIT °C a hard knock (an impact over 3), FAR °C a second more with the escort over 150 m
  // ahead; lost at TMAX. The escort: its pace by the gap to the player (m ahead of the player): GAP0..GAP1 its own, beyond GAP1 slower
  // down to SLOW, under GAP0 (or the player ahead of it) quicker
  const K = { T0: 4.0, TMAX: 8.0, RISE: 0.016, HIT: 0.25, FAR: 0.02, FARGAP: 150, GAP0: 25, GAP1: 70, SLOW: 0.45, LOST: 300, LOSTT: 8 };
  const ESC_PACE = 1.0;
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
      if (typeof THREE !== 'undefined') { r.hs = KIT.hospital(r, r.race.track, r.race.track.finishS + 12); r.hosp = r.hs.g; }
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
      if (r.hs) r.hs.blink(r.t);   // (the ambulance's lamps, one side then the other)
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
