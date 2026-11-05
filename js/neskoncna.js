// Neskončna vožnja v prometu (docs/neskoncna-voznja.md): a mode of its own (endless; in the menu Endless traffic) on every real open road
// with traffic. Alone in the traffic, denser with every kilometre; points for the speed and for close passes; the run over at the first
// crash; at the end of the road on again from its start (a new stage). The rules are js/core.js's (Endless, race.en: the traffic's window
// round the player, the points, the end); here the mode (Zabava's hooks, js/zabava.js), the HUD, the messages, the results and the records
// (the best score and the top 10 of the road: records.tracks['<id>-endless@<physics>'].bestScore, .enBoard).
(function () {
  'use strict';
  const Z = typeof Zabava !== 'undefined' ? Zabava : require('./zabava.js');
  const tr = Z.tr, BOARD = 10;
  const num = (v) => String(Math.max(0, Math.floor(v))).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');   // (12 345: a thin space, in both languages)
  const x1 = (v) => Z.dec((Math.round(v * 10) / 10).toFixed(1));
  const posNum = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;
  // the road's top 10 as kept (plain objects with a score; anything else dropped), best first
  const boardOf = (R0) => (Array.isArray(R0.enBoard) ? R0.enBoard : []).filter(e => e && typeof e === 'object' && posNum(e.s))
    .map(e => ({ s: Math.floor(e.s), km: posNum(e.km) ? e.km : 0, st: posNum(e.st) ? Math.floor(e.st) : 1, car: typeof e.car === 'string' ? e.car.slice(0, 24) : '', d: posNum(e.d) ? e.d : 0 }))
    .sort((a, b) => b.s - a.s || a.d - b.d).slice(0, BOARD);
  const feat = {
    id: 'endless', BOARD, boardOf,
    st: null,
    modes: (d, L) => (L.indexOf('traffic') >= 0 && !d.test ? ['endless'] : []),   // (every real road with the traffic; not a test track)
    mine: (ctx) => ctx.md === 'endless' && !ctx.on && !(ctx.cr >= 0) && !ctx.mis && !ctx.school && !ctx.chal && !ctx.nv && !!ctx.track.open,
    // alone, the game's flying start (open roads: opts.flying), no flags, no rivals' characters, no slipstream, no fuel, no failures, no
    // wheel rule (two wheels gone end the drive anyway, Endless)
    opts(ctx) { return this.mine(ctx) ? { numAI: 0, numSet: undefined, playerGrid: 1, traffic: true, endless: true, police: false, fuel: false, radio: false, faults: false, flags: false, chars: false, slip: false, wheelRule: undefined } : null; },
    made(race, ctx) { if (this.mine(ctx) && race.en) race.zbMode = 'endless'; },
    begin(race) {
      this.stop();
      if (race.zbMode !== 'endless' || !race.en || typeof document === 'undefined') return;
      const hud = Z.el('hud'), box = Z.el('h-times'); if (!hud || !box) return;
      hud.classList.add('en-on');
      const el = document.createElement('div'); el.id = 'h-en'; el.setAttribute('aria-live', 'off');
      el.innerHTML = '<div class="en-sc"><b id="h-en-sc">0</b><small>' + Z.esc(tr('TOČKE')) + '</small></div><div id="h-en-cb" class="off"><b></b><i><u></u></i></div>' +
        '<div id="h-en-ln"></div><div id="h-en-pop"></div>';
      box.appendChild(el);
      const fade = document.createElement('div'); fade.id = 'en-fade'; document.body.appendChild(fade);
      this.st = { el, fade, sc: Z.el('h-en-sc'), cb: Z.el('h-en-cb'), ln: Z.el('h-en-ln'), pop: Z.el('h-en-pop'), seen: race.en.ev, popT: 0, hotT: 0, ended: false, shown: -1, line: '' };
      const G = Z.G; if (G) G.showMsg(tr('NESKONČNA VOŽNJA!'), 'gold', 1.8);
    },
    step(race, dt) {
      const S = this.st, E = race.en; if (!S || !E || race.zbMode !== 'endless') return;
      for (const e of E.log) if (e.n > S.seen) { S.seen = e.n; this.event(race, e); }
      const sc = Math.floor(E.score); if (sc !== S.shown) { S.shown = sc; S.sc.textContent = num(sc); }
      // the combo with its time left; the traffic's density and the stage
      S.cb.classList.toggle('off', !(E.combo >= 2));
      if (E.combo >= 2) { S.cb.firstChild.textContent = tr('NIZ ×{0}', E.combo); S.cb.querySelector('u').style.width = Math.round(100 * Math.max(0, E.comboT) / Core.EN.comboT) + '%'; }
      const line = tr('PROMET ×{0}', x1(race.tf.win.dens)) + ' · ' + tr('ETAPA {0}', E.stage) + ' · ' + Z.dec((E.dist / 1000).toFixed(1)) + ' km';
      if (line !== S.line) { S.line = line; S.ln.textContent = line; }
      if (S.popT > 0 && (S.popT -= dt) <= 0) S.pop.className = '';
      if (S.hotT > 0 && (S.hotT -= dt) <= 0) S.ln.classList.remove('hot');
    },
    // what the drive tells: a close pass (the points over the score, a beep; the commentator now and then), the traffic denser, the
    // road's start again (black for a moment, the camera behind the car again), the combo broken by a touch
    event(race, e) {
      const S = this.st, G = Z.G, sfx = typeof Sfx !== 'undefined' ? Sfx : null;
      const pop = (t, cls) => { S.pop.textContent = t; S.pop.className = 'show ' + (cls || ''); S.popT = 1.3; };
      if (e.k === 'near' || e.k === 'vnear') {
        pop('+' + num(e.pts) + ' ' + tr(e.k === 'vnear' ? 'ZELO TESNO!' : 'TESNO!'), e.k);
        if (sfx && sfx.beep) sfx.beep(e.k === 'vnear' ? 1320 : 990, 0.07, 0.1);
        if (G && (e.k === 'vnear' || e.combo >= 3) && Math.random() < 0.35) G.say(e.combo >= 3 ? 'zbEnCombo' : 'zbEnClose', { n: e.combo }, 1);
      } else if (e.k === 'tap') pop(tr('NIZ PREKINJEN'), 'bad');
      else if (e.k === 'dens') { S.ln.classList.add('hot'); S.hotT = 1.6; }
      else if (e.k === 'stage') {
        const f = S.fade; f.style.transition = 'none'; f.style.opacity = '1'; void f.offsetWidth; f.style.transition = 'opacity 0.7s ease-out'; f.style.opacity = '0';
        if (typeof Render !== 'undefined' && Render.resetCam) Render.resetCam();
        if (G) { G.showMsg(tr('ETAPA {0}', race.en.stage), 'gold', 1.6); G.say('zbEnStage', { n: race.en.stage }, 3); }
      }
    },
    over(race) {
      const S = this.st, E = race && race.en; if (!S || S.ended || !E || !E.over || race.zbMode !== 'endless') return null;
      S.ended = true;
      return { msg: tr('TRK! KONEC VOŽNJE'), cls: 'slow', say: 'zbEnOver', vars: { pts: num(E.score) } };
    },
    noPodium(race) { return !!race && race.zbMode === 'endless'; },
    // the results of its own: the score, the road's top 10 with this run in it, a new record
    finish(race) {
      const S = this.st, G = Z.G, E = race && race.en; if (!S || !E || race.zbMode !== 'endless' || !G || typeof document === 'undefined') return false;
      const $ = (id) => document.getElementById(id), R0 = G.rec(race.track.def.id), P = race.player;
      const run = { s: Math.floor(E.score), km: Math.round(E.dist / 10) / 100, st: E.stage, car: P.m.id, d: Date.now() };
      const B = boardOf(R0), best = posNum(R0.bestScore) ? R0.bestScore : 0, newRec = run.s > 0 && run.s > best;
      let rank = 0; if (run.s > 0) { B.push(run); B.sort((a, b) => b.s - a.s || a.d - b.d); rank = B.indexOf(run) + 1; }
      R0.enBoard = B.slice(0, BOARD); if (newRec) R0.bestScore = run.s;
      G.saveRecords();
      const why = { crash: tr('Trk z vozilom.'), wall: tr('Trk v ograjo.'), roll: tr('Avto se je prevrnil.'), fall: tr('Avto je zgrmel v prepad.'), wheels: tr('Avto je izgubil kolesi.') }[E.over ? E.over.why : ''] || '';
      $('res-pos').textContent = rank > 0 && rank <= BOARD ? String(rank) : '–';
      $('res-title').textContent = newRec ? tr('Nov rekord!') : tr('Konec vožnje');
      $('res-sub').textContent = tr('{0} točk · {1} km · etapa {2}.', num(run.s), Z.dec(run.km.toFixed(1)), run.st) + (why ? ' ' + why : '');
      $('res-head').classList.remove('tt'); $('res-tt').classList.add('off'); const laps = $('res-laps'); if (laps) laps.classList.add('off');
      $('res-table').querySelector('thead').innerHTML = '<tr><th>' + Z.esc(tr('Neskončna vožnja')) + '</th><th></th></tr>';
      const rows = [[tr('Točke'), num(run.s)], [tr('Za hitrost'), num(E.spd)], [tr('Za tesna prehitevanja'), num(E.bonus)], [tr('Prevoženo'), Z.dec(run.km.toFixed(2)) + ' km'],
        [tr('Tesno / zelo tesno'), E.near + ' / ' + E.vnear], [tr('Najdaljši niz'), E.comboBest > 1 ? '×' + E.comboBest : '–'], [tr('Najvišja hitrost'), Math.round(E.vmax * 3.6) + ' km/h'],
        [tr('Promet na koncu'), '×' + x1(race.tf.win.dens)], [tr('Rekord'), num(Math.max(best, run.s))]];
      $('res-table').querySelector('tbody').innerHTML = rows.map(([a, b], i) => '<tr' + (i === 0 ? ' class="me"' : '') + '><td>' + Z.esc(a) + '</td><td>' + Z.esc(b) + '</td></tr>').join('');
      $('res-restart').dataset.act = 'restart'; $('res-restart').textContent = tr('Vozi znova');
      Z.resEnd('endless');
      const name = (id) => { const M = typeof Core !== 'undefined' && Core.MODELS.find(m => m.id === id); return M ? M.name : ''; };
      Z.resAdd('<div class="en-board"><b>' + Z.esc(tr('Najboljših 10 · {0}', typeof Lang !== 'undefined' && Lang.of ? Lang.of(race.track.def, 'name') : race.track.def.name)) + '</b><table><tbody>' + R0.enBoard.map((e, i) => '<tr' + (e === run ? ' class="me"' : '') + '><td>' + (i + 1) + '.</td><td>' + num(e.s) + '</td><td>' +
        Z.dec(e.km.toFixed(1)) + ' km</td><td>' + Z.esc(name(e.car)) + '</td></tr>').join('') + '</tbody></table></div>');
      G.showScreen('results');
      return true;
    },
    stop() {
      const S = this.st; this.st = null;
      const hud = Z.el('hud'); if (hud) hud.classList.remove('en-on');
      if (S) { S.el.remove(); S.fade.remove(); }
    },
  };
  if (typeof Comm !== 'undefined' && Comm.addLines) {
    Comm.addLines('zbEnGo', ['Off you go! Keep it fast, keep it clean, and squeeze past the traffic.', 'The road is yours, and it only gets busier. How far can you go?', 'Endless traffic, one life. Points for speed, more for the close ones!']);
    Comm.addLines('zbEnClose', ['Ooh, that was close!', 'Inches to spare!', 'Threading the needle there!']);
    Comm.addLines('zbEnCombo', ['The combo keeps building!', 'One after another, superb!', 'What a run of close passes!']);
    Comm.addLines('zbEnStage', ['Back to the bottom of the road, the traffic stays heavy!', 'Another lap of the road, and still going!', 'On we go again, stage {n}!']);
    Comm.addLines('zbEnOver', ['And that is the end of the run! {pts} points.', 'Crash! The run is over with {pts} points.', 'That one ends it. {pts} points on the board.']);
  }
  Z.add(feat);
  if (typeof module !== 'undefined') module.exports = feat;
})();
