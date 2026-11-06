// Zabava · 7 · Pregon s prijatelji (docs/novosti-e.md, Novost 2; docs/zabava.md, c: Ti loviš s prijatelji): online, in a private room,
// on an open road with traffic (the mode traffic): one friend drives the patrol car, the others run from it. The host picks the mode
// Pregon in the room's row Način (js/zabava.js) and who drives the patrol (Po vrsti: in turn from race to race, the one who drove it
// least; or a player chosen); the setup takes it to every phone (js/game.js netBeg: the traffic from the host's seed, the patrol car's
// player). The fugitives start 150 m up the road (each phone moves its own car), the patrol on the grid. The rules of Ti loviš
// (js/zabava/lov.js, K): caught after 5 s in all within 15 m of the patrol (closer than 5 m, a knock, counts more; the meter drains
// slowly); escaped after 3:00, over the finish, 10 s on end more than 400 m ahead, or when the patrol is gone. Every phone shows its own
// meter; the host decides (as the cuts of the elimination race) and sends it to every phone: { t: 'zb', k: 'bgd', no, id, st, at, why }
// for one fugitive, { k: 'bge', no, at } when nobody runs any more. A caught fugitive pulls over and stops (Race.retire), its finish
// 100000 s less the time it was caught (the results order it so, as the elimination race's out); one who got away: the time it did.
// The results: the patrol (Ujel 2 od 3), those who got away, those still running, those caught (the longer the better).
(function () {
  'use strict';
  const Z = typeof Zabava !== 'undefined' ? Zabava : require('../zabava.js');
  const tr = Z.tr;
  const L0 = typeof require !== 'undefined' && typeof Zabava === 'undefined' ? require('./lov.js') : (Z.list.find(f => f.id === 'lov') || {});
  const K = Object.assign({ head: 150, near: 15, fill: 5, knock: 0.15, far: 400, farT: 10, limit: 180, drain: 20 }, L0.K || {}, { touch: 5 });
  const OUT = 100000;
  const trk = (id) => (typeof Core !== 'undefined' && Core.TRACKS ? Core.TRACKS.find(d => d.id === id) : null);
  // an open road with traffic (the roads of Ti loviš, js/zabava/lov.js)
  const fits = (d) => !!d && !!d.open && Array.isArray(d.modes) && d.modes.indexOf('traffic') >= 0;
  const css = (h) => '#' + ((h >>> 0) & 0xffffff).toString(16).padStart(6, '0');
  // a car moved by m up the road (a fugitive's start), its place across the road kept on the asphalt, its distance with it
  function ahead(race, c, by) {
    const T = race.track, q = c.q; if (!T || !q || !(q.i >= 0) || !Number.isFinite(q.s)) return false;
    const s0 = q.s, s = Math.min(T.len - 60, s0 + by), i = T.idx(s), j = Math.min(T.N - 1, i + 1), f = Math.max(0, Math.min(1, s / T.ds - i)), L = (A) => A[i] + (A[j] - A[i]) * f;   // (between two samples of the road)
    const w = Math.max(0, T.wS(s) - c.m.wid / 2 - 0.3), d = Math.max(-w, Math.min(w, q.d || 0));
    c.place(L(T.px) + L(T.nx) * d, L(T.pz) + L(T.nz) * d, T.hd[i]); if (T.hasElev) c.y = c.py = L(T.hy);
    c.q = T.query(c.x, c.z, i, c.q); c.dist += c.q.s - s0; c.sPrev = c.q.s; c.vx = c.vz = 0;
    if (race.putBack) race.putBack(c);
    return true;
  }

  const feat = {
    id: 'beg', K, OUT, ahead, fits,
    st: null,
    netMode: { label: 'Pregon', fits: (mp) => !mp.quick && !(mp.ch && mp.ch.on) && fits(trk(mp.track)) },
    // the patrol car's player for this grid: the host's choice when it is on the grid, else by turn
    pick(grid) { const p = this.net.pol; return p && grid.indexOf(p) >= 0 ? p : this.byTurn(grid); },
    // by turn: the one who drove the patrol least, the room's order on a tie (the host first)
    byTurn(ids) {
      const T = this.net.turns, G = Z.G, mp = G && G.mp(), ord = mp && Array.isArray(mp.players) ? mp.players.map(p => p.id) : [];
      const at = (id) => { const i = ord.indexOf(id); return i < 0 ? 1e3 : i; };
      return ids.slice().sort((a, b) => (T[a] || 0) - (T[b] || 0) || at(a) - at(b))[0] || '';
    },
    // the room (host): the mode on, the patrol by turn or the one chosen (Patrulja, under the row Način); a friend sees the host's choice
    netSet(on) { this.net.on = !!on; if (on) Z.netOne(this); this.netSend(); },
    netOff() { if (this.net.on) this.netSet(false); },
    netSend() {
      const G = Z.G, mp = G && G.mp(); if (!mp || mp.role !== 'host' || typeof Net === 'undefined') return;
      const m = { t: 'zb', k: 'bg', on: this.net.on ? 1 : 0, pol: this.net.pol || '', next: this.net.next || '' };
      for (const id of Net.ids) Net.sendTo(id, m);
    },
    room(host, busy) {
      const G = Z.G, mp = G && G.mp(); if (!mp || typeof document === 'undefined') return;
      const ref = Z.el('zb-mode') || Z.el('on-chrow'); if (!ref) return;
      let row = Z.el('zb-bgpol');
      if (!row) {
        row = document.createElement('div'); row.className = 'row'; row.id = 'zb-bgpol';
        row.innerHTML = '<span class="rlbl"></span><select id="zb-bgsel" class="txt"></select>';
        ref.insertAdjacentElement('afterend', row);
        row.querySelector('select').addEventListener('change', (e) => { const M = Z.G.mp(); if (!M || M.role !== 'host') return; this.net.pol = e.target.value || ''; this.netSend(); Z.room(true, !!M.setup); });
      }
      const ps = Array.isArray(mp.players) ? mp.players : [], ok = this.netMode.fits(mp), sel = row.querySelector('select');
      if (host) { this.net.next = this.byTurn(ps.map(p => p.id)); if (this.net.pol && !ps.some(p => p.id === this.net.pol)) this.net.pol = ''; }
      const nm = (id) => { const p = ps.find(x => x.id === id); return p ? (p.id === mp.me ? (G.S && G.S.name) || p.name : p.name) : ''; };
      row.querySelector('.rlbl').textContent = tr('Patrulja'); sel.setAttribute('aria-label', tr('Patrulja'));
      const O = [['', this.net.next && nm(this.net.next) ? tr('Po vrsti ({0})', nm(this.net.next)) : tr('Po vrsti')]].concat(ps.map(p => [p.id, nm(p.id) + (p.id === mp.me ? tr(' (ti)') : '')]));
      const html = O.map(([v, t]) => '<option value="' + Z.esc(v) + '">' + Z.esc(t) + '</option>').join('');
      if (sel.dataset.h !== html) { sel.innerHTML = html; sel.dataset.h = html; }
      sel.value = this.net.pol && ps.some(p => p.id === this.net.pol) ? this.net.pol : '';
      sel.disabled = !host || !!busy || !!mp.race;
      row.classList.toggle('off', !this.net.on || !ok);
      if (host) { const sig = [this.net.on ? 1 : 0, this.net.pol, this.net.next, ps.map(p => p.id).join(',')].join('|'); if (sig !== this.net.sig) { this.net.sig = sig; this.netSend(); } }   // (a friend who came in later hears it too)
    },
    // the mode applies to the race about to start (the host): on, in a private room on an open road with traffic, no other mode on
    applies(mp) { return this.net.on && this.netMode.fits(mp) && !Z.list.some(f => f !== this && f.net && f.net.on); },
    netSetup(grid) {
      const G = Z.G, mp = G && G.mp(); if (!mp || mp.role !== 'host') return;
      mp.beg = Array.isArray(grid) && grid.length > 1 && this.applies(mp) ? { pol: this.pick(grid) } : null;   // (js/game.js netBeg: with the setup to every phone)
    },
    made(race, ctx) {
      const G = Z.G, mp = G && G.mp(), R = mp && mp.race;
      if (!ctx || !ctx.on || !R || R.tf !== 1 || !R.pol || !race.tf || race.zbMode) return;
      const pc = R.pol === mp.me ? race.player : (race.remotes || []).find(c => c.netOf && c.netOf.id === R.pol);
      if (!pc || !pc.police || race.cars.length < 2) return;
      race.zbMode = 'beg'; race.zbBeg = true;
      if (mp.role === 'host') this.net.turns[R.pol] = (this.net.turns[R.pol] || 0) + 1;   // (by turn: the next race another one)
    },
    begin(race) {
      this.st = null;
      if (race.zbMode !== 'beg') return;
      const G = Z.G, mp = G && G.mp(), R = mp && mp.race; if (!R) return;
      const P = race.player, pc = R.pol === mp.me ? P : (race.remotes || []).find(c => c.netOf && c.netOf.id === R.pol); if (!pc) return;
      const F = new Map();
      for (const c of race.cars) if (c !== pc) { const id = c === P ? mp.me : c.netOf && c.netOf.id; if (id != null) F.set(id, { id, c, m: 0, farT: 0, d: 1e9, st: 'run', at: 0, why: '' }); }
      this.st = { pc, pid: R.pol, F, n0: F.size, caught: 0, host: mp.role === 'host', me: mp.me, mine: pc === P ? 'pol' : 'run', no: R.no, end: null, ended: false, over: false };
      const hud = Z.el('hud'); if (hud) hud.classList.add('zb-line');
      if (pc !== P) ahead(race, P, K.head);   // (each fugitive's phone its own car: the others see it there from its states)
      if (!G) return;
      if (pc === P) { G.showMsg(tr('PATRULJA · ULOVI BEGUNCE!'), 'gold', 1.8); G.say('zbBegPatrol', { n: F.size }, 2); }
      else { G.showMsg(tr('BEŽI PRED PATRULJO!'), 'slow', 1.8); if (G.toast) G.toast(tr('Patruljo vozi {0}.', pc.name || ''), 3600); G.say('zbBegRun', { name: pc.name || '' }, 2); }
    },
    // a friend's car gone from the race (left it, the connection lost: js/game.js carGone)
    gone(id) { const G = Z.G, mp = G && G.mp(), C = mp && mp.race && mp.race.cars && mp.race.cars.get(id); return !!(C && C.off); },
    // who decides: the host; a friend once the host is gone (alone, its own phone)
    judge() { const S = this.st, G = Z.G, mp = G && G.mp(); return !!S && (S.host || !!(mp && mp.gone) || this.gone('h')); },
    step(race, dt) {
      const S = this.st; if (!S || race.zbMode !== 'beg' || S.over) return;
      const G = Z.G, mp = G && G.mp(), R = mp && mp.race; if (!R || R.no !== S.no) return;
      const ph = G.phase(); if (ph === 'intro' || ph === 'lights' || !(race.time > 0)) return;
      const pc = S.pc, P = race.player, J = this.judge(), pOff = (pc !== P && this.gone(S.pid)) || !!pc.finished;
      for (const f of S.F.values()) {
        if (f.st !== 'run') continue;
        const c = f.c;
        if (c !== P && this.gone(f.id)) { if (J) this.decide(race, f, 'left', ''); continue; }
        const d = Math.hypot(c.x - pc.x, c.z - pc.z), gap = c.dist - pc.dist; f.d = d;
        if (d < K.near && !c.finished && !pOff) f.m = Math.min(1, f.m + dt / K.fill + (d < K.touch ? K.knock * dt * 8 : 0));
        else f.m = Math.max(0, f.m - dt / K.drain);
        f.farT = gap > K.far && !pOff ? f.farT + dt : 0;
        if (!J) continue;
        if (c.finished) this.decide(race, f, 'e', 'fin');
        else if (f.m >= 1) this.decide(race, f, 'c', '');
        else if (pOff) this.decide(race, f, 'e', 'pol');
        else if (f.farT >= K.farT) this.decide(race, f, 'e', 'far');
        else if (race.time >= K.limit) this.decide(race, f, 'e', 'time');
      }
      if (J && !S.over && ![...S.F.values()].some(f => f.st === 'run')) this.decideEnd(race);
      // my own run over the finish: mine at once (the host says so too, a moment later)
      if (!S.end && P.finished) { const me = S.F.get(S.me); if (S.mine === 'pol') S.end = this.polEnd(); else if (me && me.st !== 'c') S.end = { msg: tr('POBEGNIL SI!'), cls: 'fast', say: 'zbBegEscaped', vars: { name: pc.name || '' } }; }
      this.hud(race);
    },
    // the line under the time: the fugitive its meter or how far the patrol is behind; the patrol the nearest fugitive's (the fullest meter)
    hud(race) {
      const S = this.st, G = Z.G, el = Z.el('h-gap'); if (!G) return;
      if (S.end) { G.setText('h-gap', ''); return; }
      const t = G.fmt(Math.max(0, K.limit - race.time), false).replace(/\.\d+$/, '');
      let f = null;
      if (S.mine === 'pol') { for (const x of S.F.values()) if (x.st === 'run' && (!f || x.m > f.m || (x.m === f.m && x.d < f.d))) f = x; }
      else f = S.F.get(S.me);
      if (!f || f.st !== 'run') { G.setText('h-gap', ''); return; }
      const gap = Math.max(0, Math.round(f.c.dist - S.pc.dist));
      G.setText('h-gap', f.m > 0 ? tr('ARETACIJA {0} % · {1}', Math.round(f.m * 100), t) : S.mine === 'pol' ? tr('BEGUNEC {0} m · {1}', gap, t) : tr('PATRULJA {0} m · {1}', gap, t));
      if (el) { const pol = S.mine === 'pol'; el.classList.toggle('zb-ok', pol ? f.m > 0 : f.farT > 0); el.classList.toggle('zb-red', pol ? f.farT > 0 : f.m > 0); }
    },
    polEnd() { const S = this.st; return { msg: tr('UJEL SI {0} OD {1}', S.caught, S.n0), cls: S.caught === S.n0 ? 'gold' : 'slow', say: 'zbBegEnd', vars: { n: S.caught, of: S.n0 } }; },
    // the host: one fugitive's fate (or a friend's phone alone), to every phone, then here
    send(m) { const S = this.st; if (S && S.host && typeof Net !== 'undefined') for (const id of Net.ids) Net.sendTo(id, m); },
    decide(race, f, st, why) { const S = this.st, m = { t: 'zb', k: 'bgd', no: S.no, id: f.id, st, at: +race.time.toFixed(3), why }; this.send(m); this.apply(race, m); },
    decideEnd(race) { const S = this.st, m = { t: 'zb', k: 'bge', no: S.no, at: +race.time.toFixed(3) }; this.send(m); this.applyEnd(race, m); },
    apply(race, m) {
      const S = this.st, G = Z.G, mp = G && G.mp(), R = mp && mp.race, f = S && S.F.get(String(m.id)); if (!f || f.st !== 'run' || !R) return;
      f.st = m.st === 'c' ? 'c' : m.st === 'left' ? 'left' : 'e'; f.at = +m.at || 0; f.why = String(m.why || '');
      if (f.st === 'c') { S.caught++; f.m = 1; }
      const P = race.player;
      if (f.c === P) {
        if (f.st === 'c') { R.mine = +(OUT - f.at).toFixed(3); race.retire(P); S.end = { msg: tr('ULOVLJEN!'), cls: 'slow', say: 'zbBegCaught', vars: { name: S.pc.name || '' } }; }   // (pulls over and stops)
        else if (f.st === 'e') { if (R.mine == null && !P.finished) R.mine = f.at; if (!S.end) S.end = { msg: tr('POBEGNIL SI!'), cls: 'fast', say: 'zbBegEscaped', vars: { name: S.pc.name || '' } }; }   // (over the finish: js/game.js netMyFinish gives mine)
      } else if (G && G.toast && f.st !== 'left') G.toast(tr(f.st === 'e' ? 'Pobegnil je: {0}' : S.mine === 'pol' ? 'Ujel si: {0}' : 'Patrulja je ujela: {0}', f.c.name || ''), 2600);
      if (G && G.netResults) G.netResults();   // (the results on the screen: again)
    },
    applyEnd(race, m) {
      const S = this.st, G = Z.G, mp = G && G.mp(), R = mp && mp.race; if (!S || S.over || !R) return;
      S.over = true;
      for (const f of S.F.values()) if (f.st === 'run') { f.st = 'e'; f.at = +m.at || 0; }   // (a fate that did not arrive: got away)
      if (S.mine === 'pol') { if (R.mine == null) R.mine = +m.at || race.time; if (!S.end) S.end = this.polEnd(); }
      if (G && G.netResults) G.netResults();
    },
    net(m, from, host, race) {
      if (!m || host) return;   // (only the host decides)
      const G = Z.G, mp = G && G.mp(), S = this.st;
      if (m.k === 'bg') { this.net.on = m.on === 1; this.net.pol = String(m.pol || ''); this.net.next = String(m.next || ''); if (mp && !mp.race) Z.room(false, !!mp.setup); }
      else if ((m.k === 'bgd' || m.k === 'bge') && S && race && race.zbMode === 'beg' && mp && mp.race && m.no === S.no && Number.isFinite(m.at)) { if (m.k === 'bgd') this.apply(race, m); else this.applyEnd(race, m); }
    },
    over() { const S = this.st; if (!S || S.ended || !S.end) return null; S.ended = true; const G = Z.G; if (G) G.setText('h-gap', ''); return S.end; },
    outWord(c) { const S = this.st; if (!S) return ''; for (const f of S.F.values()) if (f.c === c && f.st === 'c') return tr('ULOVLJEN'); return ''; },
    // the results online (js/game.js netResults): the patrol, those who got away (sooner first), those still running, those caught (the
    // longer the better), those who left; waiting: my part is not over yet (the patrol: until nobody runs)
    netRes(race) {
      const S = this.st; if (!S || race.zbMode !== 'beg') return null;
      const L = [...S.F.values()], run = !S.over && L.some(f => f.st === 'run'), me = S.F.get(S.me), esc = L.filter(f => f.st === 'e').length;
      return { waiting: S.mine === 'pol' ? run : !me || me.st === 'run', win: S.mine === 'pol' ? !run && esc === 0 && S.caught > 0 : !!me && me.st === 'e', table: () => this.table(race), draw: () => this.draw(race) };
    },
    // (not rows: that is the hook of the timing tower's red rows, js/zabava.js, called in every race)
    table(race) {
      const S = this.st, G = Z.G, P = race.player, L = [...S.F.values()], run = !S.over && L.some(f => f.st === 'run');
      const nm = (c) => (c === P ? (G && G.S && G.S.name) || tr('Igralec') : c.name || tr('Prijatelj'));
      const why = (f) => (f.why === 'fin' ? tr('cilj') : f.why === 'far' ? tr('predaleč') : f.why === 'pol' ? tr('brez patrulje') : G ? G.fmt(f.at, false).replace(/\.\d+$/, '') : '');
      const res = (f) => (f.st === 'e' ? tr('Pobegnil ({0})', why(f)) : f.st === 'c' ? tr('Ulovljen po {0}', G ? G.fmt(f.at, false).replace(/\.\d+$/, '') : f.at) : f.st === 'left' ? tr('odšel') : tr('beži …'));
      const out = [{ c: S.pc, me: S.pc === P, name: nm(S.pc), pol: true, res: run ? tr('lovi …') : tr('Ujel {0} od {1}', S.caught, S.n0) }];
      const by = (st, k) => L.filter(f => f.st === st).sort(k);
      for (const f of [].concat(by('e', (a, b) => a.at - b.at), by('run', (a, b) => b.c.dist - a.c.dist), by('c', (a, b) => b.at - a.at), by('left', () => 0))) out.push({ c: f.c, me: f.c === P, name: nm(f.c), pol: false, res: res(f), f });
      return out;
    },
    draw(race) {
      if (typeof document === 'undefined') return;
      const S = this.st, G = Z.G, $ = (id) => document.getElementById(id), me = S.F.get(S.me), L = [...S.F.values()], run = !S.over && L.some(f => f.st === 'run');
      const fm = (t) => (G ? G.fmt(t, false).replace(/\.\d+$/, '') : String(t));
      let pos, title, sub;
      if (S.mine === 'pol') { pos = S.caught + '/' + S.n0; title = run ? tr('Lov še traja …') : tr('Ujel si {0} od {1}', S.caught, S.n0); sub = run ? tr('Begunci še bežijo.') : tr('Lov je končan po {0}.', fm(race.time >= K.limit ? K.limit : (L.reduce((a, f) => Math.max(a, f.at || 0), 0)))); }
      else if (me && me.st === 'c') { pos = '✕'; title = tr('Ulovljen!'); sub = tr('Ulovljen po {0}.', fm(me.at)); }
      else if (me && me.st === 'e') { pos = '✓'; title = tr('Pobegnil si!'); sub = me.why === 'fin' ? tr('Pripeljal si do konca ceste.') : me.why === 'far' ? tr('Patrulja je bila predaleč.') : me.why === 'pol' ? tr('Patrulje ni več za tabo.') : tr('Zdržal si {0}.', fm(K.limit)); }
      else { pos = '…'; title = tr('Lov še traja …'); sub = ''; }
      if (S.mine !== 'pol' && run && me && me.st !== 'run') sub += tr(' Lov še traja …');
      const set = (id, t) => { const e = $(id); if (e) e.textContent = t; };
      set('res-pos', pos); set('res-title', title); set('res-sub', sub.trim());
      const tb = $('res-table'); if (!tb) return;
      tb.querySelector('thead').innerHTML = '<tr><th>#</th><th>' + Z.esc(tr('Voznik')) + '</th><th>' + Z.esc(tr('Avto')) + '</th><th>' + Z.esc(tr('Izid')) + '</th><th>' + Z.esc(tr('Vloga')) + '</th></tr>';
      tb.querySelector('tbody').innerHTML = this.table(race).map((r, i) => '<tr class="' + (r.me ? 'me' : '') + '"><td>' + (i + 1) + '</td><td><span class="dot" style="background:' + css(r.c.color) + '"></span>' + Z.esc(r.name) + (r.me ? Z.esc(tr(' (ti)')) : '') + '</td><td>' + Z.esc(r.c.m ? r.c.m.name : '') + '</td><td>' + Z.esc(r.res) + '</td><td>' + Z.esc(tr(r.pol ? 'Patrulja' : 'Begunec')) + '</td></tr>').join('');
    },
    stop() { this.st = null; const hud = Z.el('hud'); if (hud) hud.classList.remove('zb-line'); },
  };
  if (typeof Comm !== 'undefined' && Comm.addLines) {
    Comm.addLines('zbBegPatrol', ['You are in the patrol car! Lights on, siren on, go and bring them in!', 'The patrol car is yours. They are up the road, stay close and catch them!', 'Siren on! The fugitives have a head start, close the gap!']);
    Comm.addLines('zbBegRun', ['{name} is in the patrol car and you are the one they are after. Run!', 'The police are behind you, and it is {name} at the wheel! Get away!', 'Run! {name} has the lights on and is coming for you!']);
    Comm.addLines('zbBegCaught', ['Caught! {name} has you, pull over.', 'That is it, you are caught! {name} got you.', 'Busted! {name} brings you in.']);
    Comm.addLines('zbBegEscaped', ['You are away! {name} will not catch you now.', 'Escaped! The patrol is left behind.', 'Gone! {name} has lost you this time.']);
    Comm.addLines('zbBegEnd', ['The chase is over! {n} caught of {of}.', 'That is the end of the pursuit: {n} of {of} brought in.', 'All done! {n} of {of} caught.']);
  }
  // the room's state on the hook net itself (as js/zabava/elim.js: net.on, read by the row Način in js/zabava.js): the mode on, the host's
  // choice (pol, '': by turn), the next by turn (next), how often each one drove the patrol (turns), what the friends last heard (sig)
  Object.assign(feat.net, { on: false, pol: '', next: '', turns: {}, sig: '' });
  Z.add(feat);
  if (typeof module !== 'undefined') module.exports = feat;
})();
