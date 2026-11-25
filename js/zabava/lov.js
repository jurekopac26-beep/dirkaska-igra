// Zabava · 6 · Ti loviš (docs/zabava.md, c; docs/police-chase.md): a mode of its own (lov: in the menu Police chase, the side Police) on
// every open road with traffic: the run from the police the other way round. The player's car is a patrol car, white like the ones in the
// run (lights, siren, the traffic pulls over for it: Traffic._siren), the fugitive an AI car up the road at the start (the rivals' own code
// drives it), racing away through traffic as thin as in the run (tfDens). Caught: fill s in all within near m of it (a knock counts more);
// it pulls over and stops. Escaped: farT s on end more than 400 m ahead, or over the finish, or the 3:00 are up. By the difficulty (KD,
// after POL_DIFF in js/core.js turned round): the head start, near, fill and farT; Normal is K. Under the line a meter (h-lovm): the arrest
// filling (green), the escape running out (red).
(function () {
  'use strict';
  const Z = typeof Zabava !== 'undefined' ? Zabava : require('../zabava.js');
  const tr = Z.tr;
  const K = { head: 150, near: 15, fill: 5, knock: 0.15, far: 400, farT: 10, limit: 180, drain: 20 };
  // Easy, Normal, Hard, Super hard: the fugitive's start further on, the patrol closer for longer, out of sight sooner (the 3:00 the same)
  const KD = [{ head: 120, near: 18, fill: 4, farT: 13 }, {}, { head: 170, near: 13, fill: 6, farT: 8 }, { head: 190, near: 12, fill: 7.5, farT: 7 }];
  const kOf = (d) => Object.assign({}, K, KD[Math.max(0, Math.min(3, Number.isFinite(d) ? Math.round(d) : 1))]);
  const feat = {
    id: 'lov', K, KD, kOf,
    st: null,
    modes: (d, L) => (L.indexOf('traffic') >= 0 ? ['lov'] : []),
    mine: (ctx) => ctx.md === 'lov' && !ctx.on && !(ctx.cr >= 0) && !ctx.mis && !ctx.school && !ctx.chal && !ctx.nv && !!ctx.track.open,
    opts(ctx) { return this.mine(ctx) ? { numAI: 1, playerGrid: 2, traffic: true, tfDens: 0.85, police: false, flying: 0, fuel: false, radio: false, faults: false, flags: false } : null; },
    made(race, ctx) {
      if (!this.mine(ctx)) return;
      race.zbMode = 'lov'; race.zbLov = true;
      const P = race.player; P.police = true; P.pol = { mode: 'chase', kind: 'car', t: 0 };   // (the patrol car's look and siren; the traffic makes way for it)
      P.color = 0xf2f4f6;   // (white, as the patrol cars in the run from the police: Police._car; before the cars are drawn)
    },
    begin(race) {
      this.st = null;
      const hud = Z.el('hud');
      if (race.zbMode !== 'lov') return;
      if (hud) hud.classList.add('zb-line', 'zb-lovm');
      const P = race.player, o = race.cars.find(c => c !== P), G = Z.G; if (!o) return;
      const k = kOf(race.opts && race.opts.difficulty != null ? race.opts.difficulty : G && G.S ? G.S.difficulty : 1);   // (the rules of the race's difficulty, as the fugitive's own: DIFF)
      if (G && G.placeAt) { G.placeAt(o, P.q.s + k.head); o.dist = P.dist + k.head; }   // (the fugitive's start: up the road)
      this.st = { o, k, m: 0, farT: 0, end: null, ended: false, t: 0, hits: 0 };
      if (G) { G.showMsg(tr('ULOVI BEGUNCA!'), 'gold', 1.8); G.say('zbLovIntro', { name: o.name }, 2); }
    },
    step(race, dt) {
      const S = this.st; if (!S || S.ended || race.zbMode !== 'lov') return;
      const G = Z.G, ph = G ? G.phase() : 'racing', P = race.player, o = S.o, k = S.k; if (ph !== 'racing' || !(race.time > 0)) return;
      if (typeof Sfx !== 'undefined' && Sfx.siren) Sfx.siren(0.55, 0);
      const d = Math.hypot(o.x - P.x, o.z - P.z), gap = o.dist - P.dist;
      if (d < k.near && !o.finished) S.m = Math.min(1, S.m + dt / k.fill + (P.hitCar > 0.5 && o.hitCar > 0.5 ? k.knock * dt * 8 : 0));
      else S.m = Math.max(0, S.m - dt / k.drain);
      S.farT = gap > k.far ? S.farT + dt : 0;
      const left = Math.max(0, k.limit - race.time);
      if (S.m >= 1) { S.end = { msg: tr('ULOVLJEN! BEGUNEC JE USTAVLJEN'), cls: 'fast', say: 'zbLovCaught', vars: { name: o.name }, ok: true }; race.retire(o); }
      else if (o.finished || S.farT >= k.farT || left <= 0) S.end = { msg: tr('POBEGNIL JE!'), cls: 'slow', say: 'zbLovEscaped', vars: { name: o.name }, ok: false, why: o.finished ? 'fin' : S.farT >= k.farT ? 'far' : 'time' };
      if (G && !S.end) {
        const t = G.fmt(left, false).replace(/\.\d+$/, '');
        G.setText('h-gap', S.m > 0 ? tr('ARETACIJA {0} % · {1}', Math.round(S.m * 100), t) : tr('BEGUNEC {0} m · {1}', Math.max(0, Math.round(gap)), t));
        const el = Z.el('h-gap'); if (el) { el.classList.toggle('zb-ok', S.m > 0); el.classList.toggle('zb-red', S.farT > 0); }
        // the meter under the line: the arrest (green) or, while the fugitive is out of reach, the time it has left to get away (red)
        const bar = Z.el('h-lovm'), red = S.farT > 0 && !(S.m > 0);
        if (bar && bar.firstElementChild) { bar.classList.toggle('zb-red', red); bar.firstElementChild.style.width = Math.round((red ? 1 - S.farT / k.farT : S.m) * 100) + '%'; }
      }
    },
    over() { const S = this.st; if (!S || S.ended || !S.end) return null; S.ended = true; if (typeof Sfx !== 'undefined' && Sfx.siren) Sfx.siren(0, 0); return S.end; },
    noPodium(race) { return !!race && race.zbMode === 'lov'; },
    // the results of its own: caught (the time it took: the record) or escaped (why)
    finish(race) {
      const S = this.st, G = Z.G; if (!S || race.zbMode !== 'lov' || !G || typeof document === 'undefined') return false;
      const ok = !!(S.end && S.end.ok), t = race.time, $ = (id) => document.getElementById(id), R0 = G.rec(race.track.def.id);
      let newRec = false; if (ok && (!R0.bestRace || t < R0.bestRace)) { R0.bestRace = t; newRec = true; G.saveRecords(); }
      $('res-pos').textContent = ok ? '✓' : '✕';
      $('res-title').textContent = tr(ok ? 'Ulovljen!' : 'Pobegnil je');
      const why = !S.end ? '' : S.end.why === 'fin' ? tr('Begunec je pripeljal do konca ceste.') : S.end.why === 'far' ? tr('Begunec je bil predaleč.') : S.end.why === 'time' ? tr('Čas je potekel.') : '';
      $('res-sub').textContent = (ok ? tr('Begunca {0} si ustavil po {1}.', S.o.name, G.fmt(t, true)) + (newRec ? tr(' Nov rekord.') : '') : tr('Begunec {0} ti je ušel. {1}', S.o.name, why)) +
        (ok && G.inCareer() ? G.careerPay(Math.round((typeof Core !== 'undefined' ? Core.careerPrize(1, 2, race.track.raceLen, Math.min(G.S.difficulty, 2)) : 3000) / 100) * 100, 'Nagrada za ulov') : '');
      $('res-head').classList.remove('tt'); $('res-tt').classList.add('off'); const laps = $('res-laps'); if (laps) laps.classList.add('off');
      $('res-table').querySelector('thead').innerHTML = '<tr><th>' + Z.esc(tr('Lov')) + '</th><th></th></tr>';
      const rows = [[tr('Čas'), G.fmt(t, true)], [tr('Begunec'), S.o.name + ' · ' + S.o.m.name], [tr('Rekord'), R0.bestRace ? G.fmt(R0.bestRace, true) : '–']];
      $('res-table').querySelector('tbody').innerHTML = rows.map(([a, b], i) => '<tr' + (i === 0 ? ' class="me"' : '') + '><td>' + Z.esc(a) + '</td><td>' + Z.esc(b) + '</td></tr>').join('');
      $('res-restart').dataset.act = 'restart'; $('res-restart').textContent = tr('Ponovi lov');
      Z.resEnd('lov');
      G.showScreen('results');
      return true;
    },
    stop() { this.st = null; const hud = Z.el('hud'); if (hud) hud.classList.remove('zb-line', 'zb-lovm'); if (typeof Sfx !== 'undefined' && Sfx.siren) Sfx.siren(0, 0); },
  };
  if (typeof Comm !== 'undefined' && Comm.addLines) {
    Comm.addLines('zbLovIntro', ['Lights on, siren on! {name} is running, go and get them!', 'A fugitive up the road: {name}. Stay close and bring them in!', 'The chase is on! {name} has a head start, close the gap!']);
    Comm.addLines('zbLovCaught', ['Got them! {name} pulls over, the chase is over!', 'Caught! {name} has nowhere to go!', 'And that is the arrest! Superb driving!']);
    Comm.addLines('zbLovEscaped', ['{name} has got away! Too far ahead.', 'Gone! {name} escapes this time.', 'The fugitive is away. Better luck next time.']);
  }
  Z.add(feat);
  if (typeof module !== 'undefined') module.exports = feat;
})();
