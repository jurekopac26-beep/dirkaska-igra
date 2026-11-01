// Zabava · 2 · Eliminacija (docs/zabava.md, b): a mode of its own (elim, in the menu Elimination) wherever there is a race. Every
// 30 s the last twelfth of the field it started with is out (22 cars: 2, 100 cars: 9), the first time 45 s after the start, until
// one car is left (~5-6 min). The cars about to go have a red row in the timing tower, the countdown is under the time (#h-gap); an
// AI car that is out pulls off and stops (Race.retire), the player out ends the race (the results in the order the cars went out).
(function () {
  'use strict';
  const Z = typeof Zabava !== 'undefined' ? Zabava : require('../zabava.js');
  const tr = Z.tr;
  const E = { first: 45, every: 30, share: 12 };
  // how many go at a cut: a twelfth of the field it started with, never the last one left
  const cutN = (n0, alive) => Math.max(0, Math.min(Math.ceil(n0 / E.share), alive - 1));
  // the cuts a field of n0 needs, and when the last one is (s after the start)
  const cutsOf = (n0) => { let a = n0, k = 0; while (a > 1) { a -= cutN(n0, a); k++; } return k; };
  const lastCut = (n0) => E.first + E.every * Math.max(0, cutsOf(n0) - 1);
  // the laps of a circuit's elimination race: enough for every cut and a minute more (the cars at ~40 m/s); the race over at its last
  // lap all the same if the cuts are not done by then
  const lapsFor = (len, n0) => Math.max(3, Math.ceil((lastCut(n0) + 60) * 40 / Math.max(500, len || 0)));

  const feat = {
    id: 'elim', E, cutN, cutsOf, lastCut, lapsFor, OUT: 100000,
    st: null, net: { on: false },
    modes: (d, L) => (L.indexOf('race') >= 0 ? ['elim'] : []),
    // (not a championship's round, a mission, the driving school, a challenge: those are races of their own whatever the mode)
    mine: (ctx) => ctx.md === 'elim' && !ctx.on && !(ctx.cr >= 0) && !ctx.mis && !ctx.school && !ctx.chal && !ctx.nv && !ctx.tt,
    opts(ctx) {
      if (!this.mine(ctx)) return null;
      const n = 1 + (ctx.nAI || 0), o = { playerGrid: Math.max(1, Math.ceil(n / 2)), fuel: false, radio: false };
      if (!ctx.track.open) o.laps = lapsFor(ctx.track.len, n);
      return o;
    },
    made(race, ctx) {
      if (this.mine(ctx)) race.zbMode = 'elim';
      else if (ctx.on && this.net.on && race.cars.length > 1) {   // online with the room's switch on: every phone the same race (the laps by the track and the grid)
        race.zbMode = 'elim'; race.zbNet = true;
        if (!race.track.open) race.laps = lapsFor(race.track.len, race.cars.length);
      }
    },
    begin(race) {
      this.st = null;
      const hud = Z.el('hud');
      if (hud) hud.classList.toggle('zb-line', race.zbMode === 'elim');
      if (race.zbMode !== 'elim') return;
      const n0 = race.cars.length, G = Z.G;
      this.st = { n0, next: E.first, danger: new Set(), end: null, ended: false, out: 0, tot: n0, cuts: 0, host: !!race.zbNet && !!G && !!G.mp() && G.mp().role === 'host' };
      if (!race.zbNet) race.estimateResults = () => this.results(race);
      if (G) G.setText('h-tot', '/' + n0);
    },
    // the cars still in, best first (as the timing tower orders them)
    alive(race) {
      const O = race.order && race.order.length === race.cars.length ? race.order : race.cars.slice().sort((a, b) => b.dist - a.dist);
      return O.filter(c => !c.zbOut && !c.finished && !race.isOut(c));
    },
    step(race) {
      const S = this.st; if (!S || race.zbMode !== 'elim') return;
      const G = Z.G, ph = G ? G.phase() : 'racing', P = race.player;
      if (ph === 'intro' || ph === 'lights' || !(race.time > 0)) return;
      const A = this.alive(race), k = cutN(S.n0, A.length);
      S.danger = new Set(A.length > 1 ? A.slice(A.length - Math.min(k, A.length - 1)) : []);
      // the cuts: alone while the player is still in; online the host's phone, as long as two are left (also after its own car is out)
      const due = race.time >= S.next && A.length > 1;
      if (due && !race.zbNet && ph === 'racing' && !P.zbOut && !P.finished) this.cut(race, A);
      else if (due && race.zbNet && S.host) this.netCut(race, A);
      if (A.length !== S.tot && G) { S.tot = A.length; G.setText('h-tot', '/' + (A.length + race.cars.filter(c => c.finished && !(c.finishTime >= this.OUT / 2)).length)); }
      // the line under the time: the countdown, red when the player's car is among those about to go
      if (G && !P.zbOut && !P.finished && A.length > 1 && !S.ended) {
        const left = Math.max(0, Math.ceil(S.next - race.time)), dz = S.danger.has(P);
        G.setText('h-gap', dz ? tr('NEVARNO! IZPADEŠ ČEZ {0} s', left) : tr('IZLOČITEV ČEZ {0} s', left));
        const el = Z.el('h-gap'); if (el) { el.classList.toggle('zb-red', dz); el.classList.toggle('zb-ok', false); }
      }
    },
    // a cut: the last ones out (an AI car pulls off and stops; the player's: the race is over for the player)
    cut(race, A) {
      const S = this.st, P = race.player, k = cutN(S.n0, A.length), G = Z.G;
      S.next += E.every; S.cuts++;
      const go = A.slice(A.length - k);
      for (const c of go) {
        c.zbOut = true; c.zbT = race.time; S.out++;
        if (c === P) { const place = A.length - go.length + 1 + go.indexOf(c); S.end = { msg: tr('IZPADEL SI! {0} MESTO', String(Z.ord(place)).toUpperCase()), cls: 'slow', say: 'zbElimOut' }; }
        else race.retire(c);
      }
      const left = A.length - go.length;
      if (!P.zbOut && left === 1) S.end = { msg: tr('ZMAGA! ZADNJI NA PROGI'), cls: 'gold', say: 'win' };
      if (G && !P.zbOut && left > 1) G.showMsg(tr('IZPADLI: {0}', go.map(c => c.name || '').join(', ')), 'slow', 1.6);
    },
    // online, the host: the cut decided by its view of the race, sent to every phone (the ids best first), then applied here too
    netCut(race, A) {
      const S = this.st, G = Z.G, mp = G.mp(), k = cutN(S.n0, A.length), go = A.slice(A.length - k);
      const ids = go.map(c => (c.isPlayer ? mp.me : c.netOf && c.netOf.id)).filter(x => x != null), m = { t: 'zb', k: 'cut', no: mp.race.no, ids, at: +race.time.toFixed(3), left: A.length - go.length };
      if (typeof Net !== 'undefined') for (const id of Net.ids) Net.sendTo(id, m);
      this.applyCut(race, m);
    },
    // a cut online (from the host, or the host's own): each one out gets 100000 s less the time it went out as its finish (the results
    // order them: the last to go first, the better car of one cut first); mine ends my race; the last one left: me, the win on the clock
    applyCut(race, m) {
      const S = this.st, G = Z.G, mp = G.mp(), R = mp && mp.race, P = race.player; if (!S || !R) return;
      S.next = m.at + E.every; S.cuts++;
      m.ids.forEach((id, j) => {
        const t = +(this.OUT - m.at + 0.001 * j).toFixed(3);
        if (id === mp.me) { if (!P.zbOut) { P.zbOut = true; P.zbT = m.at; R.mine = t; S.end = { msg: tr('IZPADEL SI! {0} MESTO', String(Z.ord((m.left || 0) + 1 + j)).toUpperCase()), cls: 'slow', say: 'zbElimOut' }; } }
        else { const c = race.remotes && race.remotes.find(x => x.netOf && x.netOf.id === id); if (c && !c.zbOut) { c.zbOut = true; c.zbT = m.at; S.out++; G.finishOf(id, t); } }
      });
      const A = this.alive(race);
      if (!P.zbOut && A.length === 1 && A[0] === P && R.mine == null) { R.mine = +G.netClock().toFixed(3); S.end = { msg: tr('ZMAGA! ZADNJI NA PROGI'), cls: 'gold', say: 'win' }; }
    },
    // the room (host): the switch Eliminacija under the championship's; a friend sees it when it is on
    room(host, busy) {
      const G = Z.G, mp = G && G.mp(), ref = Z.el('on-chrow'); if (!ref || !mp) return;
      let row = Z.el('zb-elrow');
      if (!row) {
        row = document.createElement('div'); row.className = 'row'; row.id = 'zb-elrow';
        row.innerHTML = '<span class="rlbl">' + Z.esc(tr('Eliminacija')) + '</span><div class="seg"><button type="button" data-zbel="0">' + Z.esc(tr('Izklop')) + '</button><button type="button" data-zbel="1">' + Z.esc(tr('Vklop')) + '</button></div>';
        ref.insertAdjacentElement('afterend', row);
        row.addEventListener('click', (e) => { const b = e.target.closest('[data-zbel]'); const M = Z.G.mp(); if (!b || b.disabled || !M || M.role !== 'host') return; e.preventDefault(); e.stopPropagation(); this.netSet(b.dataset.zbel === '1'); });
      }
      for (const b of row.querySelectorAll('[data-zbel]')) { b.classList.toggle('sel', (b.dataset.zbel === '1') === this.net.on); b.disabled = !host || !!busy || !!mp.race; }
      row.classList.toggle('off', !host && !this.net.on);
    },
    netSet(on) { this.net.on = !!on; this.netSetup(); const G = Z.G, mp = G && G.mp(); this.room(!!mp && mp.role === 'host', !!(mp && mp.setup)); },
    netSetup() { const G = Z.G, mp = G && G.mp(); if (mp && mp.role === 'host' && typeof Net !== 'undefined') for (const id of Net.ids) Net.sendTo(id, { t: 'zb', k: 'el', on: this.net.on ? 1 : 0 }); },
    net(m, from, host, race) {
      if (!m || host) return;   // (only the host decides)
      const G = Z.G, mp = G && G.mp();
      if (m.k === 'el') { this.net.on = m.on === 1; if (mp) this.room(false, !!mp.setup); }
      else if (m.k === 'cut' && race && race.zbMode === 'elim' && mp && mp.race && m.no === mp.race.no && Array.isArray(m.ids) && Number.isFinite(m.at)) this.applyCut(race, m);
    },
    over(race) {
      const S = this.st; if (!S || S.ended || !S.end) return null;
      S.ended = true; const P = race.player, G = Z.G;
      if (G) G.setText('h-gap', '');
      return S.end;
    },
    cls(c) { const S = this.st; return S && S.danger.has(c) && !c.zbOut ? ' zb-out' : ''; },
    // the timing tower shows the first car in danger too (the cut's line), wherever the player is
    rows(O) { const S = this.st; if (!S || !S.danger.size) return []; let k = -1; for (const c of S.danger) { const i = O.indexOf(c); if (i >= 0 && (k < 0 || i < k)) k = i; } return k >= 0 ? [k] : []; },
    outWord(c) { return c.zbOut ? tr('IZPADEL') : ''; },
    noPodium(race) { return !!race && race.zbMode === 'elim'; },
    // the results: the cars over the line (a circuit's last lap came before the last cut), those still in, then those out, the last
    // to go first (a car that retired by itself among them by when it did)
    results(race) {
      const outT = (c) => (c.zbOut ? c.zbT : (c.wreck && c.wreck.dnfT) || 0);
      const fin = race.finishOrder.slice(), alive = race.cars.filter(c => !c.finished && !c.zbOut && !race.isOut(c)).sort((a, b) => b.dist - a.dist);
      const gone = race.cars.filter(c => !c.finished && (c.zbOut || race.isOut(c)) && alive.indexOf(c) < 0).sort((a, b) => outT(b) - outT(a) || b.dist - a.dist);
      const res = [];
      for (const c of fin) res.push({ car: c, time: c.finishTime, est: false, pen: 0 });
      for (const c of alive) res.push({ car: c, time: race.time, est: true, pen: 0, zb: alive.length === 1 && !fin.length ? 'Zmagovalec' : 'V dirki' });
      for (const c of gone) res.push(c.zbOut ? { car: c, time: Infinity, est: true, pen: 0, zb: 'Izpadel' } : { car: c, time: Infinity, est: true, pen: 0, dnf: true });
      return res;
    },
    // the results' head: the player out (the place, when) or the last one left
    resBase(race, info) {
      if (race.zbMode !== 'elim' || typeof document === 'undefined') return;
      const P = race.player, G = Z.G, t = document.getElementById('res-title'), s = document.getElementById('res-sub'); if (!t || !s) return;
      if (info.out) return;
      if (P.zbOut) { t.textContent = tr('Izpadel'); s.textContent = tr('Izpadel si po {0} na {1} mestu.', G.fmt(P.zbT, false), Z.ord(info.pos)) + tr(' Štartal si z {0} mesta.', Z.ord(P.grid)); }
      else if (info.pos === 1) { t.textContent = tr('Zmaga!'); s.textContent = tr('Preživel si vse izločitve ({0} avtov).', info.n) + tr(' Štartal si z {0} mesta.', Z.ord(P.grid)); }
    },
    stop() { this.st = null; const hud = typeof document !== 'undefined' && document.getElementById('hud'); if (hud) hud.classList.remove('zb-line'); },
  };
  if (typeof Comm !== 'undefined' && Comm.addLines) Comm.addLines('zbElimOut', ['You are out! Eliminated, that is the end of your race.', 'Eliminated! Not quick enough when it counted.', 'That is you out. The last places go, and you were in them.']);
  Z.add(feat);
  if (typeof module !== 'undefined') module.exports = feat;
})();
