/* Special mission 49 · Zataknjeno kolo · Suzuka, Japonska (js/missions.js; the kit: js/missions/kit.js). A Ferris wheel beside the West
   straight has stopped, people wait in its cabins high over the ground. The aerial ladder (MisKit.fireTruck) drives there from the start
   line and stops by the wheel (K.ZONE metres of road round K.STOP); the crew sets it up and the ladder is the player's: two sliders,
   DVIGNI (its angle, 0..80 deg) and IZTEGNI (its length, 7.2..33.6 m), the turntable turning by itself to the cabin it goes for. The
   wind sways the basket (the longer the ladder and the quicker it moves, the more); held within K.REACH m of a cabin's door for K.HOLD s,
   its people step into the basket (K.CAP at most); the basket down on the truck again (the ladder in): they are on the ground. All of
   them down: done; the time up: failed. The wheel: its own (a stuck one does not turn): two A-frames, the rim and its spokes, K.N
   cabins hanging under it, one mesh; the cabins with people marked on the screen (KABINA n, the people in it). */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js');
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s), dec = (s) => (typeof Lang !== 'undefined' ? Lang.dec(s) : String(s));
  const K = { AT: 4450, OFF: 4.5, AHEAD: 15, ZONE: [-14, 10], VSTOP: 2.5, VHELP: 7, R: 10, HUB: 13, N: 16, FULL: [3, 4, 5, 7, 8, 9, 11, 12], PER: 2, CAP: 4, LOOK: 0.55,
    LIFT: 1.4, VLIFT: 0.28, VEXT: 0.16, REACH: 1.5, HOLD: 1.2, SWAY: 0.9, DOWN: [0.12, 0.06] };

  // the wheel: in its own frame (x along the road, y up, z across), its cabins' doors in the world
  function wheel(r, p) {
    const W = { cab: [], g: null };
    const c = Math.cos(p.ry), s = Math.sin(p.ry), w = (x, y, z) => ({ x: p.x + x * c + z * s, y: p.y + y, z: p.z - x * s + z * c });
    for (let k = 0; k < K.N; k++) { const a = -Math.PI / 2 + (k / K.N) * Math.PI * 2, x = Math.cos(a) * K.R, y = K.HUB + Math.sin(a) * K.R - 1.6; W.cab.push(Object.assign(w(x, y, 0), { k, n: 0, lx: x, ly: y })); }
    if (typeof THREE === 'undefined') return W;
    const B = KIT.parts(), WH = 0xe8eaee, ST = 0xc7ccd3, M4 = () => new THREE.Matrix4();
    // a beam from a to b (a box along it)
    const beam = (a, b, t, col) => { const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length(), m = M4(), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
      m.compose(new THREE.Vector3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), q, new THREE.Vector3(1, 1, 1)); B.L.push({ g: new THREE.BoxGeometry(t, L, t), m, c: col }); };
    for (const zz of [-1.4, 1.4]) {
      for (let k = 0; k < 24; k++) { const a0 = k / 24 * Math.PI * 2, a1 = (k + 1) / 24 * Math.PI * 2; beam([Math.cos(a0) * K.R, K.HUB + Math.sin(a0) * K.R, zz], [Math.cos(a1) * K.R, K.HUB + Math.sin(a1) * K.R, zz], 0.35, WH); }
      for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; beam([0, K.HUB, zz * 0.4], [Math.cos(a) * K.R, K.HUB + Math.sin(a) * K.R, zz], 0.14, ST); }
    }
    for (const zz of [-3.2, 3.2]) for (const f of [-1, 1]) beam([f * 7, 0, zz], [0, K.HUB, zz * 0.45], 0.5, WH);
    beam([0, K.HUB, -2.4], [0, K.HUB, 2.4], 0.6, 0xa9afb7);
    B.box(0, 0.4, 0, 12, 0.8, 7, 0xb5b0a6);
    const COL = [0xe8452c, 0xf2c230, 0x3d8cff, 0x3fbf6a, 0xe86bb0, 0xff8a1e];
    for (const C of W.cab) { B.box(C.lx, C.ly + 0.2, 0, 2.0, 2.0, 2.0, COL[C.k % COL.length]); B.box(C.lx, C.ly + 1.3, 0, 2.2, 0.15, 2.2, 0x50565e); beam([C.lx, C.ly + 1.3, 0], [C.lx, C.ly + 1.6, 0], 0.1, ST); }
    const g = B.mesh(new THREE.MeshLambertMaterial({ vertexColors: true })); g.castShadow = true;
    const G = new THREE.Group(); G.add(g); G.position.set(p.x, p.y, p.z); G.rotation.y = p.ry; r.add(G); W.g = G;
    return W;
  }

  // the controls: two sliders (DVIGNI, IZTEGNI) and the cabins' tags; their look in css/missions.css
  function controls(r) {
    const C = { lift: 0, ext: 0, on() {}, tags() {} };
    if (typeof document === 'undefined') return C;
    const el = document.createElement('div'); el.id = 'mis-lad';
    el.innerHTML = '<label><span>' + tr('DVIGNI') + '</span><input type="range" min="0" max="1000" value="0" data-k="lift"></label><label><span>' + tr('IZTEGNI') + '</span><input type="range" min="0" max="1000" value="0" data-k="ext"></label>';
    document.body.appendChild(el);
    el.addEventListener('input', (e) => { const i = e.target.closest('input'); if (i) C[i.dataset.k] = +i.value / 1000; });
    const tg = document.createElement('div'); tg.id = 'mis-tags'; document.body.appendChild(tg);
    const touch = document.getElementById('touch');
    C.on = (show) => { el.classList.toggle('on', !!show); tg.classList.toggle('on', !!show); if (touch) touch.classList.toggle('mis-hide', !!show); document.body.classList.toggle('mis-aiming', !!show); document.body.classList.toggle('mis-ladder', !!show); if (show && typeof Input !== 'undefined' && Input.reset) Input.reset(); };
    // the tags over the cabins with people (the one the ladder goes for first, gold)
    const v = typeof THREE !== 'undefined' ? new THREE.Vector3() : null;
    C.tags = (cabs, goal) => {
      if (!v || !Render.camera) return;
      const html = cabs.filter(c => c.n > 0).map(c => { v.set(c.x, c.y + 1.6, c.z).project(Render.camera); if (v.z > 1) return '';
        return '<i class="' + (c === goal ? 'go' : '') + '" style="left:' + ((v.x + 1) / 2 * 100).toFixed(1) + '%;top:' + ((1 - v.y) / 2 * 100).toFixed(1) + '%"><b>' + tr('KABINA {0}', c.k + 1) + '</b>' + tr(c.n === 1 ? '{0} oseba' : '{0} osebi', c.n) + '</i>'; }).join('');
      if (tg.innerHTML !== html) tg.innerHTML = html;
    };
    r.add(typeof THREE !== 'undefined' ? new THREE.Group() : { userData: {}, traverse() {} });
    r.props[r.props.length - 1].userData.misUndo = () => { el.remove(); tg.remove(); if (touch) touch.classList.remove('mis-hide'); document.body.classList.remove('mis-aiming', 'mis-ladder'); };
    return C;
  }

  Missions.add({
    id: '49', title: 'Zataknjeno kolo', track: 'suzuka', limit: 480, stars: [300, 380], K,
    story: 'Ob dirkališču je obstalo panoramsko kolo. V kabinah visoko nad tlemi čakajo ljudje.',
    goal: 'Z avtolestvijo reši ljudi iz kabin obstalega kolesa.',
    hint: 'Pelji po dirkališču do panoramskega kolesa ob zadnji ravnini.',
    rows: [{ k: 'len', label: 'DOLŽINA' }, { k: 'kot', label: 'KOT' }, { k: 'sway', label: 'NIHANJE KOŠA', bar: true, col: '#ffb020' }, { k: 'res', label: 'REŠENI' }, { k: 'kos', label: 'V KOŠU' }],
    // alone on the closed circuit, one run, by day; the aerial ladder (the racing truck's physics, slower)
    opts: () => ({ tt: true, laps: 1, playerModel: KIT.truckModel('titan', { vLim: 105, kw: 560, len: 8.4 }), playerColor: 0xc4161c, damage: 0 }),
    begin(r) {
      const T = r.race.track, sW = (T.startS + K.AT) % T.len, i = T.idx(sW), side = T.br[i] >= T.bl[i] ? 1 : -1;
      r.sW = sW; r.stage = 'drive'; r.saved = 0; r.inB = 0; r.hold = 0; r.sway = 0; r.ph = 0; r.wind = 1;
      const p = KIT.at(T, sW, side * (T.wS(sW) + K.OFF));
      r.W = wheel(r, { x: p.x, y: Math.max(p.y, p.ty) - 0.2, z: p.z, ry: p.ry });
      r.wc = { x: p.x, z: p.z };
      for (const k of K.FULL) r.W.cab[k].n = K.PER;
      r.total = K.FULL.length * K.PER;
      r.truck = KIT.fireTruck(r); r.ui = controls(r);
      this.show(r);
    },
    // the cabin the ladder goes for (target): the nearest one with people (to the basket)
    target(r) { let best = null, bd = 1e9; const t = r.tip || r.truck.tipAt(); for (const c of r.W.cab) if (c.n > 0) { const d = t ? Math.hypot(c.x - t.x, c.y - t.y, c.z - t.z) : c.y; if (d < bd) { bd = d; best = c; } } return best; },
    step(r, dt) {
      const P = r.P, T = r.race.track, tk = r.truck;
      let d = (P.q ? P.q.s : 0) - (r.sW - K.AHEAD); if (d > T.len / 2) d -= T.len; if (d < -T.len / 2) d += T.len;
      const v = Math.hypot(P.vx || 0, P.vz || 0);
      if (r.stage === 'drive') {
        const inZ = d >= K.ZONE[0] && d <= K.ZONE[1];
        if (inZ && v < K.VHELP) { const k = Math.exp(-dt * 2.5); P.vx *= k; P.vz *= k; }
        if (inZ && v < K.VSTOP) { r.stage = 'ladder'; r.ui.on(true); }
        r.say(inZ ? 'Ustavi ob kolesu.' : d > K.ZONE[1] && d < 400 ? 'Kolo si zgrešil: vrni se nazaj do njega.' : tr('Do kolesa: {0} km', dec((((d < 0 ? -d : T.len - d)) / 1000).toFixed(1))));
      } else {
        KIT.hold(P);
        // the ladder toward the sliders, at its own pace; the turntable to the cabin it goes for (the basket's cabin: down to the truck)
        const want = r.auto || r.ui, L0 = tk.lift, E0 = tk.ext;
        tk.lift += Math.max(-K.VLIFT * dt, Math.min(K.VLIFT * dt, want.lift * K.LIFT - tk.lift));
        tk.ext += Math.max(-K.VEXT * dt, Math.min(K.VEXT * dt, want.ext - tk.ext));
        const goal = r.inB >= K.CAP || !this.target(r) ? null : this.target(r);
        if (goal) { let a = tk.yawTo(goal.x, goal.z) - tk.yaw; a = Math.atan2(Math.sin(a), Math.cos(a)); tk.yaw += Math.max(-0.5 * dt, Math.min(0.5 * dt, a)); }
        // the wind sways the basket: more with the ladder out, more again while it moves
        const mv = Math.abs(tk.lift - L0) / dt / K.VLIFT + Math.abs(tk.ext - E0) / dt / K.VEXT;
        r.wind = 0.75 + 0.25 * Math.sin(r.t * 0.21) + 0.2 * Math.sin(r.t * 0.73);
        const target = K.SWAY * r.wind * (0.15 + tk.ext) * (1 + 0.8 * Math.min(1, mv));
        r.sway += (target - r.sway) * Math.min(1, dt * (target > r.sway ? 1.2 : 0.35));
        r.ph += dt * 1.6;
        tk.step(0, true);
        const t0 = 'tipT' in r ? null : tk.tipAt(); r.tip = t0 ? { x: t0.x + Math.cos(P.h + 1.57) * Math.sin(r.ph) * r.sway, y: t0.y, z: t0.z + Math.sin(P.h + 1.57) * Math.sin(r.ph) * r.sway } : (r.tipT || null);
        if (r.tip && goal) {
          const dd = Math.hypot(goal.x - r.tip.x, goal.y - r.tip.y, goal.z - r.tip.z); r.dGoal = dd;
          if (dd < K.REACH) { r.hold += dt; if (r.hold >= K.HOLD) { const n = Math.min(goal.n, K.CAP - r.inB); goal.n -= n; r.inB += n; r.hold = 0; } } else r.hold = 0;
        } else r.dGoal = null;
        // the basket down on the truck: its people on the ground
        if (r.inB > 0 && tk.lift <= K.DOWN[0] && tk.ext <= K.DOWN[1]) { r.saved += r.inB; r.inB = 0; }
        if (r.saved >= r.total) { r.stage = 'done'; r.ui.on(false); KIT.hold(P, false); r.win(); }
        r.say(r.inB >= K.CAP || (r.inB > 0 && !this.target(r)) ? 'Koš je poln: spusti lestev in jo potegni nazaj, da ljudje izstopijo.' : r.dGoal != null && r.dGoal < K.REACH * 2.5 ? 'Počakaj, da se koš umiri ob kabini.' : 'Lestev dvigni in iztegni počasi: v vetru se koš ziblje.');
        r.ui.tags(r.W.cab, goal);
      }
      KIT.look(r, r.stage === 'ladder' ? r.wc : null, K.LOOK, dt);   // (the camera behind the truck turned toward the wheel while the ladder works: the user's choice, 30. 10.)
      if (r.stage !== 'ladder') tk.step(dt, r.stage !== 'done'); else tk.step(dt, true);
      this.show(r);
    },
    // driven over the finish line (a lap on, past the wheel): not done
    finish(r) { r.fail(tr('Zapeljal si mimo kolesa.')); },
    show(r) {
      const tk = r.truck, len = tk.len ? tk.len() : 7.2;
      r.set('len', dec(len.toFixed(1)) + ' m');
      r.set('kot', Math.round(tk.lift * 180 / Math.PI) + '°');
      const sw = Math.min(1, r.sway / 1.4);
      r.set('sway', tr(sw < 0.3 ? 'mirno' : sw < 0.65 ? 'vetrovno' : 'močno'), sw, sw < 0.3 ? '#3fbf6a' : sw < 0.65 ? '#ffb020' : '#e8452c');
      r.set('res', r.saved + ' / ' + r.total);
      r.set('kos', r.inB + ' / ' + K.CAP);
    },
  });
})();
