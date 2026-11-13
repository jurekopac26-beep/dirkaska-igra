// Neskončna vožnja v prometu (docs/neskoncna-voznja.md): a mode of its own (endless; in the menu Endless traffic) on the circuits of
// Core.EN.tracks (for now Bathurst). Alone in the traffic going the race's way, lap after lap, denser every 30 s; a clock you keep topped
// up (it starts at 30 s on the medium level; the close passes put seconds on it, the speed slows it down); points for the speed and for
// the close passes; the run over when the clock is empty, at any touch of a vehicle or a hard knock on the wall. The rules are
// js/core.js's (Endless, race.en: the traffic's window round the player, the clock, the points, the end); here the mode (Zabava's hooks,
// js/zabava.js), the HUD, the messages, the results and the records, kept apart by the level (the best score and the top 10:
// records.tracks['<id>-endless-<level>@<physics>'].bestScore, .enBoard; recKey in js/game.js).
(function () {
  'use strict';
  const Z = typeof Zabava !== 'undefined' ? Zabava : require('./zabava.js');
  const tr = Z.tr, BOARD = 10, LV = ['Lahka', 'Srednja', 'Težka', 'Super težka'];   // (the game's levels, Nastavitve: tr() at use)
  const EN = () => (typeof Core !== 'undefined' && Core.EN ? Core.EN : null);
  const num = (v) => String(Math.max(0, Math.floor(v))).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');   // (12 345: a thin space, in both languages)
  const x1 = (v) => Z.dec((Math.round(v * 10) / 10).toFixed(1));
  const mmss = (t) => { const s = Math.max(0, Math.floor(t)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const posNum = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;
  // a level's top 10 as kept (plain objects with a score; anything else dropped), best first: s the score, km, t the time driven (s), lap
  // the laps done, car, d the date
  const boardOf = (R0) => (Array.isArray(R0.enBoard) ? R0.enBoard : []).filter(e => e && typeof e === 'object' && posNum(e.s))
    .map(e => ({ s: Math.floor(e.s), km: posNum(e.km) ? e.km : 0, t: posNum(e.t) ? e.t : 0, lap: posNum(e.lap) ? Math.floor(e.lap) : 0, car: typeof e.car === 'string' ? e.car.slice(0, 24) : '', d: posNum(e.d) ? e.d : 0 }))
    .sort((a, b) => b.s - a.s || a.d - b.d).slice(0, BOARD);
  const feat = {
    id: 'endless', BOARD, boardOf, LV,
    st: null,
    modes: (d) => { const E = EN(); return E && E.tracks.indexOf(d.id) >= 0 && !d.open && !d.test ? ['endless'] : []; },   // (its circuits, Core.EN.tracks)
    mine: (ctx) => { const E = EN(); return ctx.md === 'endless' && !ctx.on && !(ctx.cr >= 0) && !ctx.mis && !ctx.school && !ctx.chal && !ctx.nv && !ctx.prvi && !ctx.track.open && !!E && E.tracks.indexOf(ctx.track.def.id) >= 0; },
    // alone, the game's flying start (opts.flying), laps without end, no flags, no rivals' characters, no slipstream, no fuel, no tyre wear,
    // no failures, no team radio, no wheel rule (two wheels gone end the drive anyway, Endless)
    opts(ctx) { return this.mine(ctx) ? { numAI: 0, numSet: undefined, playerGrid: 1, aiOrder: undefined, qualiBack: 0, laps: 999, endless: true, traffic: false, police: false, flying: 3, fuel: false, tyres: false, compounds: false,
      flags: false, chars: false, slip: false, faults: false, radio: false, rival: undefined, wheelRule: undefined } : null; },
    made(race, ctx) { if (this.mine(ctx) && race.en) race.zbMode = 'endless'; },
    begin(race) {
      this.stop();
      if (race.zbMode !== 'endless' || !race.en || typeof document === 'undefined') return;
      const hud = Z.el('hud'), box = Z.el('h-times'); if (!hud || !box) return;
      hud.classList.add('en-on');
      const el = document.createElement('div'); el.id = 'h-en'; el.setAttribute('aria-live', 'off');
      el.innerHTML = '<div class="en-ck" id="h-en-ckw"><b id="h-en-ck">' + Z.dec(race.en.clock.toFixed(1)) + '</b><small>s</small><em id="h-en-add"></em></div>' +
        '<div class="en-sc"><b id="h-en-sc">0</b><small>' + Z.esc(tr('TOČKE')) + '</small></div><div id="h-en-cb" class="off"><b></b><i><u></u></i></div><div id="h-en-ln"></div><div id="h-en-pop"></div>';
      box.appendChild(el);
      this.st = { el, ck: Z.el('h-en-ck'), ckW: Z.el('h-en-ckw'), add: Z.el('h-en-add'), sc: Z.el('h-en-sc'), cb: Z.el('h-en-cb'), ln: Z.el('h-en-ln'), pop: Z.el('h-en-pop'),
        seen: race.en.ev, popT: 0, addT: 0, hotT: 0, ended: false, shown: -1, ckT: '', low: false, line: '' };
      const G = Z.G; if (G) G.showMsg(tr('NESKONČNA VOŽNJA!'), 'gold', 1.8);
    },
    step(race, dt) {
      const S = this.st, E = race.en; if (!S || !E || race.zbMode !== 'endless') return;
      for (const e of E.log) if (e.n > S.seen) { S.seen = e.n; this.event(race, e); }
      const sc = Math.floor(E.score); if (sc !== S.shown) { S.shown = sc; S.sc.textContent = num(sc); }
      // the clock (tenths, never 0,0 before it is empty), red while it is nearly empty
      const ck = Z.dec((Math.ceil(E.clock * 10 - 1e-6) / 10).toFixed(1)); if (ck !== S.ckT) { S.ckT = ck; S.ck.textContent = ck; }
      const low = E.clock < EN().low; if (low !== S.low) { S.low = low; S.ckW.classList.toggle('low', low); }
      // the combo with its time left; the traffic's density, the lap and the road driven
      S.cb.classList.toggle('off', !(E.combo >= 2));
      if (E.combo >= 2) { S.cb.firstChild.textContent = tr('NIZ ×{0}', E.combo); S.cb.querySelector('u').style.width = Math.round(100 * Math.max(0, E.comboT) / EN().comboT) + '%'; }
      const line = tr('PROMET ×{0}', x1(race.tf.win.dens)) + ' · ' + tr('KROG {0}', E.lap + 1) + ' · ' + Z.dec((E.dist / 1000).toFixed(1)) + ' km';
      if (line !== S.line) { S.line = line; S.ln.textContent = line; }
      if (S.popT > 0 && (S.popT -= dt) <= 0) S.pop.className = '';
      if (S.addT > 0 && (S.addT -= dt) <= 0) S.add.className = '';
      if (S.hotT > 0 && (S.hotT -= dt) <= 0) S.ln.classList.remove('hot');
    },
    // what the drive tells: a close pass (the points and the seconds it put on the clock, a beep; the commentator now and then), the
    // traffic denser, a lap done, the clock nearly empty, the combo broken by a touch of the wall
    event(race, e) {
      const S = this.st, G = Z.G, sfx = typeof Sfx !== 'undefined' ? Sfx : null;
      const pop = (t, cls) => { S.pop.textContent = t; S.pop.className = 'show ' + (cls || ''); S.popT = 1.3; };
      if (e.k === 'near' || e.k === 'vnear') {
        pop('+' + num(e.pts) + ' ' + tr(e.k === 'vnear' ? 'ZELO TESNO!' : 'TESNO!'), e.k);
        if (e.add > 0) { S.add.textContent = '+' + x1(e.add) + ' s'; S.add.className = ''; void S.add.offsetWidth; S.add.className = 'show'; S.addT = 1.2; }
        if (sfx && sfx.beep) sfx.beep(e.k === 'vnear' ? 1320 : 990, 0.07, 0.1);
        if (G && (e.k === 'vnear' || e.combo >= 3) && Math.random() < 0.35) G.say(e.combo >= 3 ? 'zbEnCombo' : 'zbEnClose', { n: e.combo }, 1);
      } else if (e.k === 'tap') pop(tr('NIZ PREKINJEN'), 'bad');
      else if (e.k === 'dens') { S.ln.classList.add('hot'); S.hotT = 1.6; }
      else if (e.k === 'lap') { if (G) { G.showMsg(tr('KROG {0}', race.en.lap + 1), 'gold', 1.4); if (Math.random() < 0.6) G.say('zbEnLap', { n: race.en.lap }, 2); } }
      else if (e.k === 'low') { if (G) { G.showMsg(tr('ČAS SE IZTEKA!'), 'slow', 1.6); G.say('zbEnLow', null, 3); } if (sfx && sfx.beep) sfx.beep(520, 0.12, 0.12); }
    },
    over(race) {
      const S = this.st, E = race && race.en; if (!S || S.ended || !E || !E.over || race.zbMode !== 'endless') return null;
      S.ended = true;
      const w = E.over.why, vars = { pts: num(E.score) };
      return w === 'time' ? { msg: tr('ČAS JE POTEKEL!'), cls: 'slow', say: 'zbEnTime', vars } : { msg: tr(w === 'touch' ? 'DOTIK! KONEC VOŽNJE' : 'TRK! KONEC VOŽNJE'), cls: 'slow', say: 'zbEnOver', vars };
    },
    noPodium(race) { return !!race && race.zbMode === 'endless'; },
    // the results of its own: the score, why it is over, the level's top 10 with this run in it, a new record
    finish(race) {
      const S = this.st, G = Z.G, E = race && race.en; if (!S || !E || race.zbMode !== 'endless' || !G || typeof document === 'undefined') return false;
      const $ = (id) => document.getElementById(id), R0 = G.rec(race.track.def.id), P = race.player, lv = tr(LV[E.lv] || LV[1]);   // (G.rec: the key of this level, recKey)
      const run = { s: Math.floor(E.score), km: Math.round(E.dist / 10) / 100, t: Math.round(E.time * 10) / 10, lap: E.lap, car: P.m.id, d: Date.now() };
      const B = boardOf(R0), best = posNum(R0.bestScore) ? R0.bestScore : 0, newRec = run.s > 0 && run.s > best;
      let rank = 0; if (run.s > 0) { B.push(run); B.sort((a, b) => b.s - a.s || a.d - b.d); rank = B.indexOf(run) + 1; }
      R0.enBoard = B.slice(0, BOARD); if (newRec) R0.bestScore = run.s;
      G.saveRecords();
      const why = { time: tr('Čas je potekel.'), touch: tr('Dotik vozila.'), crash: tr('Trk z vozilom.'), wall: tr('Trk v ograjo.'), roll: tr('Avto se je prevrnil.'), fall: tr('Avto je zgrmel v prepad.'), wheels: tr('Avto je izgubil kolesi.') }[E.over ? E.over.why : ''] || '';
      $('res-pos').textContent = rank > 0 && rank <= BOARD ? String(rank) : '–';
      $('res-title').textContent = newRec ? tr('Nov rekord!') : tr('Konec vožnje');
      $('res-sub').textContent = tr('{0} točk · {1} km · {2}.', num(run.s), Z.dec(run.km.toFixed(1)), mmss(run.t)) + (why ? ' ' + why : '');
      $('res-head').classList.remove('tt'); $('res-tt').classList.add('off'); const laps = $('res-laps'); if (laps) laps.classList.add('off');
      $('res-table').querySelector('thead').innerHTML = '<tr><th>' + Z.esc(tr('Neskončna vožnja')) + '</th><th></th></tr>';
      const rows = [[tr('Točke'), num(run.s)], [tr('Za hitrost'), num(E.spd)], [tr('Za tesna prehitevanja'), num(E.bonus)], [tr('Čas vožnje'), mmss(E.time)], [tr('Dodan čas'), '+' + x1(E.add) + ' s'],
        [tr('Prevoženo'), Z.dec(run.km.toFixed(2)) + ' km'], [tr('Krogi'), String(E.lap)], [tr('Tesno / zelo tesno'), E.near + ' / ' + E.vnear], [tr('Najdaljši niz'), E.comboBest > 1 ? '×' + E.comboBest : '–'],
        [tr('Najvišja hitrost'), Math.round(E.vmax * 3.6) + ' km/h'], [tr('Promet na koncu'), '×' + x1(race.tf.win.dens)], [tr('Težavnost'), lv], [tr('Rekord'), num(Math.max(best, run.s))]];
      $('res-table').querySelector('tbody').innerHTML = rows.map(([a, b], i) => '<tr' + (i === 0 ? ' class="me"' : '') + '><td>' + Z.esc(a) + '</td><td>' + Z.esc(b) + '</td></tr>').join('');
      $('res-restart').dataset.act = 'restart'; $('res-restart').textContent = tr('Vozi znova');
      Z.resEnd('endless');
      const name = (id) => { const M = typeof Core !== 'undefined' && Core.MODELS.find(m => m.id === id); return M ? M.name : ''; };
      Z.resAdd('<div class="en-board"><b>' + Z.esc(tr('Najboljših 10 · {0} · {1}', typeof Lang !== 'undefined' && Lang.of ? Lang.of(race.track.def, 'name') : race.track.def.name, lv)) + '</b><table><tbody>' + R0.enBoard.map((e, i) => '<tr' + (e === run ? ' class="me"' : '') + '><td>' + (i + 1) + '.</td><td>' + num(e.s) + '</td><td>' +
        Z.dec(e.km.toFixed(1)) + ' km</td><td>' + mmss(e.t) + '</td><td>' + Z.esc(name(e.car)) + '</td></tr>').join('') + '</tbody></table></div>');
      G.showScreen('results');
      return true;
    },
    stop() {
      const S = this.st; this.st = null;
      const hud = Z.el('hud'); if (hud) hud.classList.remove('en-on');
      if (S) S.el.remove();
    },
  };
  if (typeof Comm !== 'undefined' && Comm.addLines) {
    Comm.addLines('zbEnGo', ['Off you go! Lap after lap in the traffic, and the clock is already ticking.', 'The track is yours, and it only gets busier. Keep that clock topped up!', 'Endless traffic, one life. Close passes buy you time!']);
    Comm.addLines('zbEnClose', ['Ooh, that was close!', 'Inches to spare!', 'Threading the needle there!']);
    Comm.addLines('zbEnCombo', ['The combo keeps building!', 'One after another, superb!', 'What a run of close passes!']);
    Comm.addLines('zbEnLap', ['Another lap done, and the traffic keeps coming!', 'That is lap {n} in the books!', 'Round again, still going!']);
    Comm.addLines('zbEnLow', ['The clock is nearly empty, find some close ones!', 'Running out of time here!', 'Seconds left, push!']);
    Comm.addLines('zbEnTime', ['And the clock runs out! {pts} points.', 'Time is up! The run ends with {pts} points.', 'No time left. {pts} points on the board.']);
    Comm.addLines('zbEnOver', ['And that is the end of the run! {pts} points.', 'Contact! The run is over with {pts} points.', 'That one ends it. {pts} points on the board.']);
  }
  Z.add(feat);
  if (typeof module !== 'undefined') module.exports = feat;
})();
