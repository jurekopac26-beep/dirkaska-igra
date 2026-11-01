// Zabava · 6 · Ti loviš (docs/zabava.md, c): a mode of its own (lov, in the menu Pursuit) on every open road with traffic: the run from
// the police the other way round. The player's car is a patrol car (lights, siren, the traffic pulls over for it: Traffic._siren), the
// fugitive an AI car 150 m up the road at the start, racing away through the traffic. Caught: 5 s in all within 15 m of it (a knock
// counts more); it pulls over and stops. Escaped: 10 s on end more than 400 m ahead, or over the finish, or the 3:00 are up.
(function () {
  'use strict';
  const Z = typeof Zabava !== 'undefined' ? Zabava : require('../zabava.js');
  const tr = Z.tr;
  const K = { head: 150, near: 15, fill: 5, knock: 0.15, far: 400, farT: 10, limit: 180, drain: 20 };
  const feat = {
    id: 'lov', K,
    st: null,
    modes: (d, L) => (L.indexOf('traffic') >= 0 ? ['lov'] : []),
    mine: (ctx) => ctx.md === 'lov' && !ctx.on && !(ctx.cr >= 0) && !ctx.mis && !ctx.school && !ctx.chal && !ctx.nv && !!ctx.track.open,
    opts(ctx) { return this.mine(ctx) ? { numAI: 1, playerGrid: 2, traffic: true, police: false, flying: 0, fuel: false, radio: false, faults: false, flags: false } : null; },
    made(race, ctx) {
      if (!this.mine(ctx)) return;
      race.zbMode = 'lov'; race.zbLov = true;
      const P = race.player; P.police = true; P.pol = { mode: 'chase', kind: 'car', t: 0 };   // (the patrol car's look and siren; the traffic makes way for it)
    },
    begin(race) {
      this.st = null;
      const hud = Z.el('hud');
      if (race.zbMode !== 'lov') return;
      if (hud) hud.classList.add('zb-line');
      const P = race.player, o = race.cars.find(c => c !== P), G = Z.G; if (!o) return;
      if (G && G.placeAt) { G.placeAt(o, P.q.s + K.head); o.dist = P.dist + K.head; }   // (the fugitive's start: up the road)
      this.st = { o, m: 0, farT: 0, end: null, ended: false, t: 0, hits: 0 };
      if (G) { G.showMsg(tr('ULOVI BEGUNCA!'), 'gold', 1.8); G.say('zbLovIntro', { name: o.name }, 2); }
    },
    step(race, dt) {
      const S = this.st; if (!S || S.ended || race.zbMode !== 'lov') return;
      const G = Z.G, ph = G ? G.phase() : 'racing', P = race.player, o = S.o; if (ph !== 'racing' || !(race.time > 0)) return;
      if (typeof Sfx !== 'undefined' && Sfx.siren) Sfx.siren(0.55, 0);
      const d = Math.hypot(o.x - P.x, o.z - P.z), gap = o.dist - P.dist;
      if (d < K.near && !o.finished) S.m = Math.min(1, S.m + dt / K.fill + (P.hitCar > 0.5 && o.hitCar > 0.5 ? K.knock * dt * 8 : 0));
      else S.m = Math.max(0, S.m - dt / K.drain);
      S.farT = gap > K.far ? S.farT + dt : 0;
      const left = Math.max(0, K.limit - race.time);
      if (S.m >= 1) { S.end = { msg: tr('ULOVLJEN! BEGUNEC JE USTAVLJEN'), cls: 'fast', say: 'zbLovCaught', vars: { name: o.name }, ok: true }; race.retire(o); }
      else if (o.finished || S.farT >= K.farT || left <= 0) S.end = { msg: tr('POBEGNIL JE!'), cls: 'slow', say: 'zbLovEscaped', vars: { name: o.name }, ok: false, why: o.finished ? 'fin' : S.farT >= K.farT ? 'far' : 'time' };
      if (G && !S.end) {
        const t = G.fmt(left, false).replace(/\.\d+$/, '');
        G.setText('h-gap', S.m > 0 ? tr('ARETACIJA {0} % · {1}', Math.round(S.m * 100), t) : tr('BEGUNEC {0} m · {1}', Math.max(0, Math.round(gap)), t));
        const el = Z.el('h-gap'); if (el) { el.classList.toggle('zb-ok', S.m > 0); el.classList.toggle('zb-red', S.farT > 0); }
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
    stop() { this.st = null; const hud = Z.el('hud'); if (hud) hud.classList.remove('zb-line'); if (typeof Sfx !== 'undefined' && Sfx.siren) Sfx.siren(0, 0); },
  };
  if (typeof Comm !== 'undefined' && Comm.addLines) {
    Comm.addLines('zbLovIntro', ['Lights on, siren on! {name} is running, go and get them!', 'A fugitive up the road: {name}. Stay close and bring them in!', 'The chase is on! {name} has a head start, close the gap!']);
    Comm.addLines('zbLovCaught', ['Got them! {name} pulls over, the chase is over!', 'Caught! {name} has nowhere to go!', 'And that is the arrest! Superb driving!']);
    Comm.addLines('zbLovEscaped', ['{name} has got away! Too far ahead.', 'Gone! {name} escapes this time.', 'The fugitive is away. Better luck next time.']);
  }
  Z.add(feat);
  if (typeof module !== 'undefined') module.exports = feat;
})();
