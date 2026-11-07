// Zabava · 3 · Tekmeci si zapomnijo (docs/zabava.md, d; Nastavitve: Tekmeci si zapomnijo, zbSpomin): an AI driver the player knocks
// (into its tail, or pushing into its side: Core grudgeHit) is angry with the player for the rest of the race, in a championship for the
// rest of the championship: it covers the inside against the player, never waits behind it, passes it closer, but never drives into it
// (the AI's room alongside stays). A driver the player races close and clean for 20 s respects the player: no cover against it, more
// room alongside. Shown by the commentator and an orange mark on its row of the timing tower, no words on the screen.
(function () {
  'use strict';
  const Z = typeof Zabava !== 'undefined' ? Zabava : require('../zabava.js');
  const MAD = 0.3, RESPECT = 20;

  const feat = {
    id: 'spomin', MAD, RESPECT,
    on: false, told: null,
    fits: (race, ctx) => !ctx.on && !!race.chr && !race.timeTrial && !race.quali && !race.pol && !race.zbLov && race.cars.length > 1,
    begin(race, ctx) {
      this.told = new Map();
      this.on = Z.on('spomin', 'zbSpomin') && this.fits(race, ctx);
      if (!this.on) return;
      const keep = this.kept(race);
      for (const c of race.cars) if (!c.isPlayer && c.chr) { c.chr.zbG = true; const v = keep && keep[c.name]; if (v > 0) { c.chr.zbMad = Math.min(1, v); this.told.set(c, 'mad'); } }
    },
    // a championship's grudges from its earlier rounds (rra-zabava: spomin.ch { id, round, mad: { driver: 0..1 } }); a new one starts clean
    kept(race) {
      const G = Z.G, ch = G && G.champ && G.champ(), K = Z.part('spomin');
      if (!race.champ || !ch) return null;
      if (!K.ch || K.ch.id !== ch.id || !(K.ch.round < race.champ.round) || race.champ.round === 0) { K.ch = { id: ch.id, round: -1, mad: {} }; Z.save(); return null; }
      return K.ch.mad;
    },
    step(race, dt) {
      if (!this.on) return;
      const P = race.player, G = Z.G;
      for (const c of race.cars) {
        const ch = c.chr; if (!ch || !ch.zbG) continue;
        if (ch.zbMad > MAD) { if (this.told.get(c) !== 'mad') { this.told.set(c, 'mad'); if (G) G.say('zbMad', { name: c.name }, 3); } continue; }
        if (!c.finished && !P.finished && Math.abs(c.dist - P.dist) < 15) {
          ch.zbR = (ch.zbR || 0) + dt;
          if (ch.zbR >= RESPECT && !this.told.get(c)) { this.told.set(c, 'ok'); if (G) G.say('zbRespect', { name: c.name }, 2); }
        }
      }
    },
    cls(c) { return this.on && c.chr && c.chr.zbMad > MAD ? ' zb-mad' : ''; },
    // the end of a championship's round: its grudges kept for the next rounds
    keep(race) {
      if (!this.on || !race || !race.champ) return;
      const G = Z.G, ch = G && G.champ && G.champ(), K = Z.part('spomin'); if (!ch) return;
      const mad = {}; for (const c of race.cars) if (c.chr && c.chr.zbMad > 0) mad[c.name] = +c.chr.zbMad.toFixed(2);
      K.ch = { id: ch.id, round: race.champ.round, mad }; Z.save();
    },
    resEnd(race, kind) { if (kind === 'race') this.keep(race); return ''; },
    stop() { this.on = false; this.told = null; },
  };
  if (typeof Comm !== 'undefined' && Comm.addLines) {
    Comm.addLines('zbMad', ['{name} did not like that knock. Expect no favours from now on!', 'That has made {name} angry. Watch your mirrors!', '{name} will remember that one. The door will be shut on you.']);
    Comm.addLines('zbRespect', ['Clean, hard racing with {name}. Respect between those two!', '{name} is giving you room: the respect earned by fair racing.', 'Fair play from you and {name}. That is how it should be done.']);
  }
  Z.add(feat);
  if (typeof module !== 'undefined') module.exports = feat;
})();
