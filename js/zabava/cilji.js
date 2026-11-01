// Zabava · 1 · Cilji ekipe pred dirko (docs/zabava.md, a): only in the career, on a race against rivals (a circuit, an open road, the
// duel in the traffic, the elimination race). Before the lights a card with three of the team's goals and Brez cilja; the race waits for
// the choice. At the finish a goal reached adds its share of the place's prize money (the career's careerPay); one missed adds nothing:
// no stakes, only the game's money. During the race: once the goal can not be reached any more, one short line under the map.
(function () {
  'use strict';
  const Z = typeof Zabava !== 'undefined' ? Zabava : require('../zabava.js');
  const tr = Z.tr;

  // the goals: k, the text (tr), the share of the prize it adds, whether it fits this race (ok), reached at the finish (done), already
  // missed during the race (dead; null: it can come right until the line)
  const GOALS = [
    { k: 'mesta', bonus: 0.5, need: (x) => Math.max(3, Math.min(10, Math.round((x.grid - 1) * 0.45))),
      text(x) { const n = this.need(x); return tr(n >= 5 ? 'Pridobi vsaj {0} mest' : 'Pridobi vsaj {0} mesta', n); },
      ok: (x) => x.grid >= 5 && x.n >= 5, done(i, x) { return !i.out && i.grid - i.pos >= this.need(x); }, dead: null },
    { k: 'ograja', bonus: 0.3, text: () => tr('Brez dotika ograje'), ok: () => true, done: (i, x, s) => !i.out && !s.wall, dead: (s) => s.wall },
    { k: 'praska', bonus: 0.6, text: () => tr('Brez dotika ograje in avtov'), ok: (x) => x.n > 1, done: (i, x, s) => !i.out && !s.wall && !s.car, dead: (s) => s.wall || s.car },
    { k: 'stopnicke', bonus: 0.4, text: () => tr('Na stopničke'), ok: (x) => x.grid > 3 && x.n > 3, done: (i) => !i.out && i.pos <= 3, dead: null },
    { k: 'zmaga', bonus: 0.5, text: () => tr('Zmagaj'), ok: (x) => x.grid > 1 && x.n > 1, done: (i) => !i.out && i.pos === 1, dead: null },
    { k: 'zadnji', bonus: 1, text: () => tr('Zmaga z zadnjega mesta'), ok: (x) => x.grid === x.n && x.n >= 6, done: (i) => !i.out && i.pos === 1, dead: null },
    { k: 'krog', bonus: 0.4, text: () => tr('Najhitrejši krog dirke'), ok: (x) => !x.open && x.laps >= 2 && x.n > 1, done: (i) => !i.out && !!i.fl, dead: null },
    { k: 'prednost', bonus: 0.5, text: () => tr('Zmaga z več kot 10 s prednosti'), ok: (x) => x.duel, done: (i) => !i.out && i.pos === 1 && !!i.res && i.res.length > 1 && i.res[1].time - i.res[0].time >= 10, dead: null },
  ];
  const pct = (b) => '+' + Math.round(b * 100) + ' %';

  const feat = {
    id: 'cilji', GOALS,
    goal: null, x: null, wait: false, told: false,
    // the race this card is for: { grid, n, laps, open, duel } of the player's race
    about(race) { const P = race.player; return { grid: P ? P.grid : 1, n: race.cars.length, laps: race.laps || 1, open: !!race.track.open, duel: !!race.tf && !race.pol }; },
    // three goals that fit (random, easiest first); rnd: a random number source (tests)
    pick(x, rnd) {
      const r = rnd || Math.random, L = GOALS.filter(g => g.ok(x)).map(g => ({ g, o: r() })).sort((a, b) => a.o - b.o).slice(0, 3).map(e => e.g);
      return L.sort((a, b) => a.bonus - b.bonus);
    },
    fits(race, ctx) {
      return !!ctx.career && !ctx.on && !ctx.tt && !ctx.quali && !ctx.chal && !ctx.school && !ctx.nv && !ctx.mis && !race.timeTrial && !race.quali && !race.pol && !race.chal && !race.zbLov && race.cars.length > 1 && !!race.player;
    },
    begin(race, ctx) {
      this.goal = null; this.wait = false; this.told = false; this.x = null;
      if (!this.fits(race, ctx)) return;
      const x = this.x = this.about(race), L = this.pick(x);
      if (!L.length) return;
      this.wait = true;
      Z.cardOpen({ title: tr('CILJ EKIPE'), sub: tr('Izberi cilj za to dirko. Če ga dosežeš, dobiš del nagrade za mesto več.'),
        items: L.map(g => ({ label: g.text(x), tag: tr('{0} nagrade', pct(g.bonus)), v: g.k })).concat([{ label: tr('Brez cilja'), ghost: true, v: null }]),
        onPick: (k) => {
          this.wait = false; this.goal = GOALS.find(g => g.k === k) || null;
          const G = Z.G; if (this.goal && G && G.toast) G.toast(tr('Cilj ekipe: {0} ({1} nagrade).', this.goal.text(x), pct(this.goal.bonus)), 2800);
        } });
    },
    hold() { return this.wait; },
    step(race) {
      const G = Z.G, g = this.goal;
      if (!g || this.told || !g.dead || !G || G.phase() !== 'racing') return;
      if (g.dead(G.stRun())) { this.told = true; G.showMsg(tr('CILJ EKIPE NI USPEL'), 'slow', 2); }
    },
    // the career's pay at the finish: the goal's share of the place's prize, or the line that it was missed
    resPay(race, info) {
      const g = this.goal, G = Z.G; if (!g || !G || !this.x) return '';
      const ok = g.done(info, this.x, G.stRun());
      if (!ok || !(info.prize > 0)) return tr(' Cilj ekipe ni uspel ({0}).', g.text(this.x));
      return G.careerPay(Math.round(info.prize * g.bonus / 100) * 100, 'Cilj ekipe');
    },
    stop() { this.goal = null; this.wait = false; this.x = null; },
  };
  Z.add(feat);
  if (typeof module !== 'undefined') module.exports = feat;
})();
