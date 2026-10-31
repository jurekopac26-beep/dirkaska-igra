/* Special mission 54 · Dirka tovornjakov · Nürburg, Nemčija (js/missions.js; the kit: js/missions/kit.js). A race of racing trucks (the
   player's TITAN and K.N rivals in TITANs, all with the 160 km/h limiter: OMEJEVALNIK) over the last part of the north loop: the grid
   K.S0 m past the start line (two by two, K.ROW m a row; the race's own grid moved there), to the finish line. The player's brakes heat up
   faster than a car's (MisKit.brakes; ZAVORE): hot, they fade. The water tank (VODA) cools them while HLADI is held (MisKit.button held:
   K.USE of the tank a second); empty, no more. Win: first over the line (POLOŽAJ); any other place: failed. */
(function () {
  'use strict';
  if (typeof Missions === 'undefined') return;
  const KIT = typeof MisKit !== 'undefined' ? MisKit : require('./kit.js');
  const tr = (s, ...a) => (typeof Lang !== 'undefined' ? Lang.tr(s, ...a) : s);
  const K = { S0: 15700, N: 9, GRID: 2, ROW: 9, HEAT: 0.03, COOL: 0.02, OUT: 0.6, USE: 1 / 14, VLIM: 160, DIFF: 0 };

  Missions.add({
    id: '54', title: 'Dirka tovornjakov', track: 'nring', limit: 300, stars: [133, 140], K,
    story: 'Dirka težkih dirkalnih tovornjakov. Zavore se pregrejejo hitreje kot pri avtih.',
    goal: 'Zmagaj na zadnjih petih kilometrih severne zanke. Pred ovinki zaviraj zgodaj in zavore ohladi z vodo, dokler je je kaj v rezervoarju.',
    hint: 'Pred ovinkom zaviraj zgodaj in zavore ohladi z vodo.',
    rows: [{ k: 'omej', label: 'OMEJEVALNIK' }, { k: 'pol', label: 'POLOŽAJ' }, { k: 'zavore', label: 'ZAVORE', bar: true }, { k: 'voda', label: 'VODA', bar: true, col: '#3fa8e0' }],
    // a race of TITANs (the truck's own field) from a standing start, one run to the line, dry, the easy rivals
    opts: () => ({ tt: false, numAI: K.N, laps: 1, flying: 0, playerGrid: K.GRID, difficulty: K.DIFF, playerModel: KIT.truckModel('titan', {}), damage: 0 }),
    // the grid moved to K.S0: two by two
    made(race) {
      const T = race.track;
      for (const c of race.cars) {
        const g = c.grid || 1, back = Math.floor((g - 1) / 2) * K.ROW + 4, s = T.startS + K.S0 - back, i = T.idx(s), lat = (g % 2 === 1 ? -1 : 1) * Math.min(3.0, T.wS(s) - 1.6);
        const x = T.px[i] + T.nx[i] * lat, z = T.pz[i] + T.nz[i] * lat;
        c.place(x, z, T.hd[i]); if (T.hasElev) { c.y = c.py = T.hy[i]; c.roadY = c.y; }
        c.dist = s - T.startS; c.lap = 0; c.cp = 0; c.splits = []; c.q = T.query(x, z, i, {}); c.sPrev = c.q.s;
        while (c.cp < T.cpS.length && c.dist >= T.cpDist[c.cp]) { c.splits.push(0); c.cp++; }
      }
    },
    begin(r) {
      r.br = KIT.brakes({ heat: K.HEAT, cool: K.COOL, out: K.OUT }); r.water = 1; r.cooling = false;
      if (typeof THREE !== 'undefined' && typeof document !== 'undefined') {
        r.btn = KIT.button(r, 'HLADI'); r.btn.show(true);
        if (r.btn.el) { const b = r.btn.el, up = () => { r.held = false; }; b.addEventListener('pointerdown', () => { r.held = true; }); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up); }
      }
      this.show(r);
    },
    step(r, dt) {
      const P = r.P; if (!P || !P.q) return;
      // the water on the brakes while HLADI is held (and some is left)
      r.cooling = !!(r.held || r.autoCool) && r.water > 0;
      if (r.cooling) r.water = Math.max(0, r.water - K.USE * dt);
      const h = r.br.step(P, dt, r.cooling ? 1 : 0);
      if (r.btn && r.btn.el) { r.btn.el.classList.toggle('red', h > 0.85 && r.water > 0); r.btn.label(r.water > 0 ? 'HLADI' : 'BREZ VODE'); }
      const v = Math.hypot(P.vx || 0, P.vz || 0) * 3.6;
      r.say(r.br.fade > 0 ? 'Zavore so pregrete: hladi jih z vodo in zaviraj prej.' : h > 0.7 && r.water > 0 ? 'Zavore so vroče: drži HLADI.' : r.water <= 0 ? 'Vode ni več: zaviraj nežneje.' : v > K.VLIM - 3 ? 'Na omejevalniku: odloči se pri zaviranju.' : this.hint);
      this.show(r);
    },
    // over the line: first is a win, any other place a failure
    finish(r) { const p = r.P.pos || 1; if (p === 1) r.win(); else r.fail(tr('Končal si na {0}. mestu.', p)); },
    show(r) {
      const P = r.P, v = Math.hypot((P && P.vx) || 0, (P && P.vz) || 0) * 3.6, n = r.race && r.race.cars ? r.race.cars.length : K.N + 1;
      r.set('omej', v > K.VLIM - 3 ? '● ' + K.VLIM : String(K.VLIM));
      r.set('pol', ((P && (P.pos || P.grid)) || n) + ' / ' + n);
      const h = r.br.heat;
      r.set('zavore', Math.round(Math.min(1, h) * 100) + ' %', Math.min(1, h), h < 0.5 ? '#3fbf6a' : h < 0.85 ? '#ffb020' : '#e8452c');
      r.set('voda', Math.round(r.water * 100) + ' %', r.water);
    },
  });
})();
