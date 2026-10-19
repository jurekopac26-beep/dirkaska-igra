// The rivals in the pits on the HUD (game.js aiPitHUD; Core's Race.step brings a badly damaged AI car in for the repair): Detroit (5 laps,
// damage on, no team radio), the player on autopilot from the back of the grid, the other rivals' damage only for the looks (none of them
// in for repairs but the ones hit here). On the first lap the two cars just ahead of the player badly damaged (~450 m before the way in, before
// the run-up to it): they come in at its end and are repaired; a big message as the first comes in, by the driver's name as the team radio
// gives it (J. NOVAK V BOKSIH, the pit icon), none for the second (one every 5 s at most). On the next lap, in English, the first of the
// first three and a car five places from the player: only the former's (… IN THE PITS); messages only for the first three and the cars up
// to three places from the player. The longest of them in both languages fits the column under the map upright and on its side, three
// lines at most.
//   node tests/browser/aipits.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('rivals in the pits');
const srv = await serve();
const browser = await launch();
// on to the race (the intro and the lights stepped, no gas)
const frames = (page, n = 2) => page.evaluate((n) => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
const toRacing = (page) => page.evaluate(() => { const g = window.__game; g.pause(); for (let k = 0; k < 800 && g.phase !== 'racing'; k++) g.sim(0.05, false, 0, 0); return g.phase; });
// the race on (paused, a quarter of a second at a time on autopilot, the HUD after each) until the rivals hit have come in and out again.
// Each hit: at(g, P, dE, o) (dE: a car's metres to the way in along the lap; o.lap0 the player's lap as the wave starts) says when, who the
// rivals by their places then ('top' the first of the first three that is not the player; 'p-1', 'p-2' the cars just ahead of the player;
// 'far' five places behind it, else five ahead), each badly damaged (0.8) there while it is still more than 320 m from the way in (before
// the run-up to it: in at the end of this lap; the other rivals' damage only for the looks, damage 1, so that the hit ones alone come in).
// Every big message (seen: each text it is given, as an observer of it records them; msgs: as it shows after each step, { t, txt, ic }),
// each hit car's damage at the way in and leaving the lane, the log of the rivals in (the game's: places, when shown)
const wave = (page, hits, en, max) => page.evaluate(async ([hits, en, max]) => {
  const g = window.__game, R = g.race, P = R.player, L = R.track.len, D = R.track.def.pit, M = document.getElementById('h-msg');
  const dE = (c) => (((R.track.startS + D[1] - c.q.s) % L) + L) % L, H = hits.map(h => ({ at: new Function('g', 'P', 'dE', 'o', 'return (' + h.at + ')(g, P, dE, o)'), who: h.who, cars: null }));
  const out = { msgs: [], hit: [] }, o = { lap0: P.lap }; let last = M.className.includes('show') ? M.textContent : '';
  const seen = [], mo = new MutationObserver((recs) => { for (const r of recs) for (const n of r.addedNodes) if (n.textContent) seen.push(n.textContent); }); mo.observe(M, { childList: true, subtree: true });
  g.pause(); if (en) Lang.set('en');
  for (const c of R.cars) if (!c.isPlayer && !c.pitWant && !c.inPit) c.dmgMode = 1;
  for (let k = 0; k < max; k++) {
    for (const h of H) if (!h.cars && h.at(g, P, dE, o)) {
      const O = R.order, pi = O.indexOf(P), cs = h.who.map(w => w === 'top' ? O.slice(0, 3).find(c => !c.isPlayer) : w === 'p-1' ? O[pi - 1] : w === 'p-2' ? O[pi - 2] : O[pi + 5] || (pi - 5 >= 3 ? O[pi - 5] : null));
      if (cs.every(c => c && !c.isPlayer && !c.inPit && !c.pitWant && !c.finished && dE(c) > 320)) {   // (one on its way in already or too near the way in: a moment later, or the next lap)
        h.cars = cs; for (const c of cs) { c.dmgMode = 2; c.dmg = 0.8; out.hit.push({ n: c.name, w: h.who[cs.indexOf(c)], i: O.indexOf(c), pi, c, inn: null, out: null, lane: false }); }
      }
    }
    g.sim(0.25, true); g.hud(0.25); await null;   // (await: the observer is told)
    const txt = M.className.includes('show') ? M.textContent : '';
    if (txt !== last) { last = txt; if (txt) out.msgs.push({ t: +R.time.toFixed(2), txt, ic: M.dataset.ic }); }
    for (const h of out.hit) { const c = h.c; if (c.inPit && !h.lane) h.inn = +c.dmg.toFixed(2); if (!c.inPit && h.lane) h.out = +c.dmg.toFixed(2); h.lane = c.inPit; }
    if (H.every(h => h.cars) && out.hit.every(h => h.out != null)) { out.ok = true; break; }
  }
  await null; mo.disconnect(); if (en) Lang.set('sl');
  for (const h of out.hit) delete h.c;
  out.seen = seen; out.lap = P.lap; out.t = +R.time.toFixed(2); out.log = g.aiPit;
  return out;
}, [hits.map(h => ({ at: h.at.toString(), who: h.who })), en, max]);
// a notice by the log: its rival one of the first three or within three places of the player as it came in
const near = (e) => e.i < 3 || Math.abs(e.i - e.pi) <= 3;
// what is wrong with a wave's notices: one shown for a rival not near, not at once (within 2 s of its way in), its text not given to the
// big message, or one shown less than 5 s after the one before; one seen shown with another icon than the pit's
const wrongNotes = (w, word, prev) => {
  const bad = [], shown = w.log.filter(e => e.shown != null && e.t > prev);
  for (const e of shown) { const txt = e.n.toUpperCase() + word; if (!near(e)) bad.push(e.n + ' not near'); if (e.shown - e.t > 2.01) bad.push(e.n + ' late'); if (!w.seen.includes(txt)) bad.push('no ' + txt); }
  if (w.seen.filter(t => t.endsWith(word)).length !== shown.length) bad.push(w.seen.filter(t => t.endsWith(word)).length + ' messages for ' + shown.length + ' shown');
  for (const m of w.msgs) if (m.txt.endsWith(word) && m.ic !== 'pit') bad.push(m.txt + ': icon ' + m.ic);
  return bad;
};

try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'low', shadows: 0, camera: 'chase', track: 'detroit', damage: 2, radio: 0, fuel: 0, length: 'normal', weather: 'dry', tod: 'day', tower: 1 }, { width: 640, height: 360 }, { touch: true, seed: 11 });
  await startTrack(page, 'detroit');
  await toRacing(page);

  // 1. the first lap: the two cars just ahead of the player badly damaged (~450 m before the way in); in at its end, repaired; the first
  // one's message, none for the second (in less than 5 s after it)
  const a = await wave(page, [{ at: (g, P, dE) => P.lap === 1 && dE(P) < 480, who: ['p-1', 'p-2'] }], false, 1600);
  const aShown = a.log.filter(e => e.shown != null), aBad = wrongNotes(a, ' V BOKSIH', -1);
  T.check('the two cars just ahead of the player badly damaged on the first lap: in at its end (still damaged), repaired, out again',
    !!a.ok && a.hit.length === 2 && a.hit.every(h => h.inn > 0.4 && h.out < 0.05) && a.log.filter(e => a.hit.some(h => h.n === e.n)).length === 2, JSON.stringify(a.hit));
  const pair = aShown.find(s => a.log.some(e => e !== s && near(e) && e.t >= s.shown - 1e-6 && e.t - s.shown < 3 && e.shown == null));
  T.check('a big message as such a rival comes in, at once: J. NOVAK V BOKSIH (the driver\'s name in capitals, the pit icon); for the second of the two (coming in less than 5 s after it): none',
    aShown.length >= 1 && !aBad.length && !!pair, JSON.stringify({ bad: aBad, log: a.log, seen: a.seen.filter(t => / V BOKSIH$/.test(t)) }));

  // 2. the next lap, in English: the first of the first three (not the player) and a car five places from the player (more than three as
  // it comes in, not in the first three)
  const b = await wave(page, [{ at: (g, P, dE, o) => { const c = g.race.order.slice(0, 3).find(x => !x.isPlayer); return c.lap > o.lap0 && dE(c) < 480; }, who: ['top'] },
    { at: (g, P, dE, o) => P.lap > o.lap0 && dE(P) < 480, who: ['far'] }], true, 1600);
  const top = b.hit[0] && b.log.find(e => e.n === b.hit[0].n && e.t > a.t), far = b.hit[1] && b.log.find(e => e.n === b.hit[1].n && e.t > a.t), bBad = b.ok ? wrongNotes(b, ' IN THE PITS', a.t) : ['not through'];
  T.check('in English: the first of the first three J. NOVAK IN THE PITS; the one five places from the player: no message',
    !!b.ok && !!top && !!far && near(top) && top.shown != null && !near(far) && far.shown == null && !bBad.length && !b.seen.some(t => t.includes(far.n.toUpperCase())),
    JSON.stringify({ bad: bBad, hit: b.hit, top, far, seen: b.seen.filter(t => / IN THE PITS$/.test(t)) }));
  const all = a.log.concat(b.log.filter(e => e.t > a.t)).filter(e => e.shown != null);
  T.check('only for the first three and the cars up to three places from the player, one every 5 s at most', all.length >= 2 && all.every(near) && all.every((s, k) => !k || s.shown - all[k - 1].shown >= 5 - 1e-6), JSON.stringify(all));

  // 3. the longest of them (every driver's name) in both languages, upright and on its side: in the column under the map, three lines at most
  // (the race running again: the column laid out each frame)
  const fit = [];
  await page.evaluate(() => window.__game.resume());
  for (const vp of [{ width: 360, height: 640 }, { width: 640, height: 360 }]) {
    await page.setViewportSize(vp); await frames(page, 3);
    for (const lang of ['sl', 'en']) {
      await page.evaluate(([lang]) => { const names = Core.DRIVER_NAMES.slice().sort((x, y) => y.length - x.length); Lang.set(lang); window.__game.msg(Lang.tr('{0} V BOKSIH', names[0].toUpperCase()), '', 600); }, [lang]);
      await frames(page, 3);
      fit.push(await page.evaluate(([lang]) => {
        const M = document.getElementById('h-msg'), fs = parseFloat(getComputedStyle(M).fontSize), map = document.getElementById('h-map').getBoundingClientRect(), r = M.getBoundingClientRect();
        const o = { lang, w: innerWidth, txt: M.textContent, ic: M.dataset.ic, fs, lines: Math.round((M.clientHeight - 7) / parseFloat(getComputedStyle(M).lineHeight)),
          ok: M.className.includes('show') && M.scrollWidth <= M.clientWidth + 2 && M.clientHeight <= fs * 1.05 * 3 + 9 && fs >= 10 && r.left >= map.left - 1 && r.right <= map.right + 1 && r.top >= map.bottom };
        M.className = ''; Lang.set('sl'); return o;
      }, [lang]));
    }
  }
  T.check('the longest (every driver\'s name), in both languages, upright and on its side: in the column under the map, three lines at most, the pit icon',
    fit.length === 4 && fit.every(o => o.ok && o.ic === 'pit'), JSON.stringify(fit));
  T.check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
} catch (e) {
  T.check('the test ran through', false, String(e && e.stack || e).split('\n').slice(0, 3).join(' '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
