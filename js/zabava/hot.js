// Hot lap (docs/igra.md, docs/svetovna-lestvica.md, svetovna-lestvica-obseg 2; Matej 26. 11.): a short mode of its own (hot, in the
// menu Hot lap) on every circuit with a race. Alone on the track, a flying start from the straight before the line (as qualifying's,
// Track.qualiBack), no lights, the clock from the line; K.laps timed laps, each one a flying lap (the ghost of the best one from the
// first lap on, js/game.js ghLapSample). No fuel, flags, rivals' characters, faults or radio: only the lap. The records its own
// (<id>-hot@phys, js/game.js recKey): the best lap, kept apart from the race's (a race's lap depends on the rivals). The world
// leaderboard (#672/#688/#743) is a separate next step: this mode works offline, alone.
(function () {
  'use strict';
  const Z = typeof Zabava !== 'undefined' ? Zabava : require('../zabava.js');
  const tr = Z.tr;
  const K = { laps: 3 };

  // a lap's gap to the best one before it: '-0.312' (quicker), '+1.040' (slower), '' (none to compare)
  const gapTxt = (t, ref) => (ref > 0 && t > 0 ? (t < ref ? '-' : '+') + Math.abs(t - ref).toFixed(3) : '');

  const feat = {
    id: 'hot', K, gapTxt,
    st: null,
    // circuits only (a lap from the line to the line): a track with a race, not an open road or a time trial; not the test tracks or
    // those awaiting the user's choice (frozen, CLAUDE.md)
    modes: (d, L) => (L.indexOf('race') >= 0 && !d.open && !d.timeTrial && !d.test && !d.pending ? ['hot'] : []),
    // (not a championship's round, a mission, the driving school, a challenge, online: those are races of their own whatever the mode)
    mine: (ctx) => ctx.md === 'hot' && !ctx.on && !(ctx.cr >= 0) && !ctx.mis && !ctx.school && !ctx.chal && !ctx.nv && !ctx.tt && !ctx.quali && !ctx.track.open,
    opts(ctx) {
      if (!this.mine(ctx)) return null;
      return { numAI: 0, numSet: undefined, playerGrid: 1, aiOrder: undefined, qualiBack: ctx.track.qualiBack(), laps: K.laps, flying: 0, traffic: false, police: false,
        fuel: false, strat: false, flags: false, chars: false, slip: false, faults: false, radio: false, rival: undefined, voznja: undefined, wheelRule: undefined };
    },
    made(race, ctx) { if (this.mine(ctx)) race.zbMode = 'hot'; },
    begin(race) {
      this.st = null;
      if (race.zbMode !== 'hot') return;
      const G = Z.G, R = G && G.rec ? G.rec(race.track.def.id) : {};
      this.st = { rec0: R.bestLap || 0, best: R.bestLap || 0, n: 0 };
      if (G) G.setText('h-gap', this.st.best ? tr('REKORD {0}', G.fmt(this.st.best, true)) : '');
    },
    // after each lap: its time and the gap to the best one before it (the record, then this run's best); the line under the time the same
    step(race) {
      const S = this.st; if (!S || race.zbMode !== 'hot') return;
      const P = race.player, G = Z.G, L = P.lapTimes || [];
      if (L.length === S.n) return;
      S.n = L.length;
      const t = L[L.length - 1], g = gapTxt(t, S.best), quick = !S.best || t < S.best;
      if (quick) S.best = t;
      if (!G) return;
      G.showMsg((quick ? tr('NAJBOLJŠI KROG {0}', G.fmt(t, true)) : tr('KROG {0}', G.fmt(t, true))) + (g ? ' (' + g + ')' : ''), quick ? 'gold' : 'slow', 2.2);
      G.setText('h-gap', g ? tr('ZADNJI {0}', g) : '');
      const el = Z.el('h-gap'); if (el) { el.classList.toggle('zb-ok', quick && !!g); el.classList.toggle('zb-red', !quick); }
    },
    noPodium(race) { return !!race && race.zbMode === 'hot'; },
    // the results' head: the best lap (a new record or the gap to it), the laps one by one
    resBase(race, info) {
      if (race.zbMode !== 'hot' || typeof document === 'undefined') return;
      const S = this.st, P = race.player, G = Z.G, t = document.getElementById('res-title'), s = document.getElementById('res-sub'); if (!t || !s || !S || !G) return;
      const L = P.lapTimes || [], best = L.length ? Math.min(...L) : 0;
      t.textContent = tr('Hot lap');
      if (!best) { s.textContent = tr('Brez časa: krog ni bil končan.'); return; }
      s.textContent = tr('Najboljši krog {0}', G.fmt(best, true)) + (!S.rec0 || best < S.rec0 ? tr(' (nov rekord proge)') : tr(' ({0} za rekordom)', gapTxt(best, S.rec0))) + '. ' + tr('Krogi: {0}.', L.map(x => G.fmt(x, true)).join(', '));
    },
    stop() {
      this.st = null;
      const el = typeof document !== 'undefined' && document.getElementById('h-gap'); if (el) { el.classList.remove('zb-ok'); el.classList.remove('zb-red'); }
    },
  };
  Z.add(feat);
  if (typeof module !== 'undefined') module.exports = feat;
})();
