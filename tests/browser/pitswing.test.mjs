// The places a pit stop gained or lost on the HUD (game.js pitSwingHUD; Core's Race._pitSwing: the place 150 m before the way in against
// the one once the order has settled after the stop): the Red Bull Ring, the team radio on, the player on autopilot told to come in on the
// first lap. Once out of the lane (after the hand-back, VOZIŠ TI!) one big message, as the result has it: +2 MESTI (green), −1 MESTO (red)
// or BREZ SPREMEMBE, the pit icon, at once or once the message before it is gone; the engineer's line with the place now ("S postankom si
// izgubil 1 mesto, zdaj si 7.") after "Dober postanek.". The Slovenian forms (1 MESTO, 2 MESTI, 3 and 4 MESTA, 5 MEST, the same lost) and
// the English (+1 PLACE, +2 PLACES, −1 PLACE, NO CHANGE), the radio's lines in both (the leader's: zdaj vodiš / you are leading now);
// waiting for another big message (no longer than 2 s); with the team radio off the message alone. The longest of them in both languages
// fits the column under the map upright and on its side.
//   node tests/browser/pitswing.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('a stop\'s places');
const srv = await serve();
const browser = await launch();
const frames = (page, n = 2) => page.evaluate((n) => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
const toRacing = (page) => page.evaluate(() => { const g = window.__game; g.pause(); for (let k = 0; k < 800 && g.phase !== 'racing'; k++) g.sim(0.05, false, 0, 0); return g.phase; });
// the message and the radio's line a result gives (d: places gained, negative lost; pos: the place now), as the game should word them
const SL = (n) => n % 100 === 1 ? 'mesto' : n % 100 === 2 ? 'mesti' : n % 100 === 3 || n % 100 === 4 ? 'mesta' : 'mest';
const EN = (n) => n === 1 ? 'place' : 'places';
const want = (d, pos, en) => {
  const n = Math.abs(d), w = n + ' ' + (en ? EN(n) : SL(n));
  const msg = d > 0 ? '+' + w.toUpperCase() : d < 0 ? '−' + w.toUpperCase() : en ? 'NO CHANGE' : 'BREZ SPREMEMBE';
  const radio = en ? (d > 0 ? `The stop gained you ${w}, ${pos === 1 ? 'you are leading now' : 'you are P' + pos + ' now'}.` : d < 0 ? `The stop cost you ${w}, you are P${pos} now.` : `No change after the stop, ${pos === 1 ? 'you are still leading' : 'you are still P' + pos}.`)
    : d > 0 ? `S postankom si pridobil ${w}, ${pos === 1 ? 'zdaj vodiš' : 'zdaj si ' + pos}.` : d < 0 ? `S postankom si izgubil ${w}, zdaj si ${pos}.` : `Brez spremembe po postanku, ${pos === 1 ? 'še vedno vodiš' : 'še vedno si ' + pos}.`;
  return { msg, cls: d > 0 ? 'fast' : d < 0 ? 'warn' : 'gold', radio };
};
// a result given to the game as Core gives one (race.psw: res, n), the race on a quarter of a second at a time (paused, on autopilot, the
// HUD after each step) until its message shows or 4 s have gone: what showed (text, class, icon), how long after the result, the radio's
// new lines. pre(g): before it (another big message)
const fake = (page, d, pos, pre) => page.evaluate(async ([d, pos, pre]) => {
  const g = window.__game, R = g.race, M = document.getElementById('h-msg'), n0 = g.teamRadio.log.length;
  g.hud(3);   // (the message before it gone)
  if (pre) new Function('g', pre)(g);
  R.psw.res = { d, pos0: pos + d, pos1: pos, gain: [], lose: [], t: R.time }; R.psw.n++;
  const t0 = R.time; let o = null;
  for (let k = 0; k < 16 && !o; k++) { g.sim(0.25, true); g.hud(0.25); const L = g.pitSwing, e = L[L.length - 1]; if (e && e.shown != null) o = { txt: M.textContent, cls: M.className.replace('show', '').trim(), ic: M.dataset.ic, after: +(e.shown - t0).toFixed(2), on: M.className.includes('show') }; }
  return Object.assign({ d, pos, radio: g.teamRadio.log.slice(n0).filter(t => /^(S postankom|Brez spremembe po|The stop|No change after)/.test(t)) }, o || { txt: null });   // (not the gaps at the line, if crossed meanwhile)
}, [d, pos, pre ? pre.toString().replace(/^[^{]*\{|\}\s*$/g, '') : '']);

try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'low', shadows: 0, camera: 'chase', track: 'rbring', damage: 0, radio: 1, fuel: 0, length: 'normal', weather: 'dry', tod: 'day', tower: 1 }, { width: 640, height: 360 }, { touch: true, seed: 5 });
  await startTrack(page, 'rbring');
  await toRacing(page);

  // 1. a stop: told to come in half way round the first lap; on until a little after its result's message (paused, a quarter of a second at a
  // time on autopilot, the HUD after each). Every big message as it shows (text, class, icon, the autopilot's part then), the lane in and
  // out, the results, the radio
  const a = await page.evaluate(async () => {
    const g = window.__game, R = g.race, P = R.player, L = R.track.len, M = document.getElementById('h-msg'), out = { msgs: [], in: null, out: null, back: null };
    let last = '', was = false;
    for (let k = 0; k < 1600; k++) {
      if (P.lap === 1 && P.dist > L * 0.4 && !P.repairN && !P.inPit) P.pitWant = true;
      g.sim(0.25, true); g.hud(0.25); await null;
      if (P.inPit && !was) out.in = { t: +R.time.toFixed(2), pos: P.pos };
      if (!P.inPit && was) { out.out = { t: +R.time.toFixed(2), pos: P.pos }; P.pitWant = false; }
      was = P.inPit;
      if (out.out && !g.pitAuto.st && out.back == null) out.back = +R.time.toFixed(2);
      const txt = M.className.includes('show') ? M.textContent : '';
      if (txt !== last) { last = txt; if (txt) out.msgs.push({ t: +R.time.toFixed(2), txt, cls: M.className.replace('show', '').trim(), ic: M.dataset.ic, ap: g.pitAuto.st }); }
      const L2 = g.pitSwing; if (L2.length && L2[0].shown != null && R.time > L2[0].shown + 1) break;
    }
    out.log = g.pitSwing; out.radio = g.teamRadio.log; out.lap = P.lap; out.psw = R.psw && { n: R.psw.n, pos0: R.psw.res && R.psw.res.pos0, pos1: R.psw.res && R.psw.res.pos1 };
    return out;
  });
  const e = a.log[0], w = e && want(e.d, e.pos1, false), seen = e ? a.msgs.filter(m => m.txt === w.msg) : [];
  T.check('a stop: one result once out of the lane (2 s or more after it); its big message once, after the hand-back (+2 MESTI green, −1 MESTO red, BREZ SPREMEMBE; the pit icon)',
    !!a.in && !!a.out && a.log.length === 1 && e.t >= a.out.t + 2 - 0.26 && seen.length === 1 && seen[0].cls === w.cls && seen[0].ic === 'pit' && !seen[0].ap && e.shown != null && e.shown >= a.back - 1e-6 && e.shown - e.t <= 2.26 && e.pos1 === a.psw.pos1,
    JSON.stringify({ in: a.in, out: a.out, back: a.back, log: a.log, msgs: a.msgs.slice(-6) }));
  const good = a.radio.findIndex(t => /^Dober postanek\./.test(t)), swing = e ? a.radio.indexOf(w.radio) : -1;
  T.check('... the engineer on the radio after "Dober postanek.": the places and the place now ("S postankom si izgubil 1 mesto, zdaj si 7.")', good >= 0 && swing > good, JSON.stringify({ want: w && w.radio, radio: a.radio }));

  // 2. the Slovenian forms and the English, the message and the radio's line (the leader's too), each at once (no other message)
  const sl = [], en = [];
  for (const [d, p] of [[1, 6], [2, 4], [3, 5], [4, 2], [5, 3], [11, 4], [-1, 7], [-2, 8], [-3, 9], [-5, 12], [0, 5], [2, 1], [0, 1]]) sl.push(await fake(page, d, p));
  await page.evaluate(() => Lang.set('en'));
  for (const [d, p] of [[1, 6], [2, 4], [-1, 7], [-3, 9], [0, 5], [2, 1], [0, 1]]) en.push(await fake(page, d, p));
  await page.evaluate(() => Lang.set('sl'));
  const wrong = (xs, isEn) => xs.filter(x => { const w = want(x.d, x.pos, isEn); return x.txt !== w.msg || x.cls !== w.cls || x.ic !== 'pit' || x.after > 0.26 || !x.on || x.radio.length !== 1 || x.radio[0] !== w.radio; });
  T.check('the Slovenian forms: +1 MESTO, +2 MESTI, +3 and +4 MESTA, +5 and +11 MEST, −1 MESTO ... BREZ SPREMEMBE, green, red, gold, the pit icon; the radio: "S postankom si pridobil 2 mesti, zdaj si 4.", the leader\'s "zdaj vodiš"',
    sl.length === 13 && !wrong(sl, false).length, JSON.stringify(wrong(sl, false).length ? wrong(sl, false) : sl.map(x => x.txt + ' | ' + x.radio[0])));
  T.check('in English: +1 PLACE, +2 PLACES, −1 PLACE, −3 PLACES, NO CHANGE; the radio: "The stop gained you 2 places, you are P4 now.", the leader\'s "you are leading now"',
    en.length === 7 && !wrong(en, true).length, JSON.stringify(wrong(en, true).length ? wrong(en, true) : en.map(x => x.txt + ' | ' + x.radio[0])));

  // 3. another big message on: shown once it is gone (1 s), or after 2 s at most (one of 5 s); the team radio off: the message alone
  const w1 = await fake(page, -2, 6, (g) => { g.msg('ZADNJI KROG!', 'gold', 1); });
  const w5 = await fake(page, 3, 4, (g) => { g.msg('ZADNJI KROG!', 'gold', 5); });
  await page.evaluate(() => { window.__game.S.radio = 0; });
  const off = await fake(page, 1, 5);
  await page.evaluate(() => { window.__game.S.radio = 1; });
  T.check('another big message on: the places once it is gone (after 1 s), else after 2 s at most (one of 5 s); the team radio off: the message, no line',
    w1.txt === want(-2, 6).msg && w1.after >= 0.99 && w1.after <= 1.26 && w5.txt === want(3, 4).msg && w5.after >= 1.99 && w5.after <= 2.26 && off.txt === '+1 MESTO' && off.after <= 0.26 && !off.radio.length,
    JSON.stringify({ w1, w5, off }));

  // 4. the longest of them in both languages, upright and on its side: in the column under the map, three lines at most, the pit icon
  const fit = [];
  await page.evaluate(() => window.__game.resume());
  for (const vp of [{ width: 360, height: 640 }, { width: 640, height: 360 }]) {
    await page.setViewportSize(vp); await frames(page, 3);
    for (const [lang, txt] of [['sl', 'BREZ SPREMEMBE'], ['sl', '−12 MEST'], ['en', '−12 PLACES'], ['en', 'NO CHANGE']]) {
      await page.evaluate(([lang, txt]) => { Lang.set(lang); window.__game.msg(txt, 'warn', 600); }, [lang, txt]);
      await frames(page, 3);
      fit.push(await page.evaluate(([lang]) => {
        const M = document.getElementById('h-msg'), fs = parseFloat(getComputedStyle(M).fontSize), map = document.getElementById('h-map').getBoundingClientRect(), r = M.getBoundingClientRect();
        const o = { lang, w: innerWidth, txt: M.textContent, ic: M.dataset.ic, fs, ok: M.className.includes('show') && M.scrollWidth <= M.clientWidth + 2 && M.clientHeight <= fs * 1.05 * 3 + 9 && fs >= 10 && r.left >= map.left - 1 && r.right <= map.right + 1 && r.top >= map.bottom };
        M.className = ''; Lang.set('sl'); return o;
      }, [lang]));
    }
  }
  T.check('the longest of them, in both languages, upright and on its side: in the column under the map, three lines at most, the pit icon', fit.length === 8 && fit.every(o => o.ok && o.ic === 'pit'), JSON.stringify(fit));
  T.check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
} catch (e) {
  T.check('the test ran through', false, String(e && e.stack || e).split('\n').slice(0, 3).join(' '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
