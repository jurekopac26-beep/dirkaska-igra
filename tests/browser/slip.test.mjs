// The slipstream in the game: a race at the Red Bull Ring (12 rivals, the player on autopilot) has it; in the wake of a car ahead the
// speedometer's ZAVETRJE lights up, out of it it goes out (in English: SLIPSTREAM). A time trial has none (Pikes Peak).
//   node tests/browser/slip.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('slipstream');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', track: 'rbring' }, { width: 390, height: 844 }, { seed: 7 });
  await startTrack(page, 'rbring');
  // (stepped in 0.4 s pieces; two frames after each draw the HUD from the car as it is then)
  const s = await page.evaluate(async () => { const g = window.__game, P = g.race.player, el = document.getElementById('h-tow'), out = [];
    for (let k = 0; k < 120; k++) { g.pause(); g.sim(0.4, true); g.resume(); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); out.push({ t: +g.race.time.toFixed(1), tow: +(P.tow || 0).toFixed(2), on: getComputedStyle(el).display !== 'none' }); }
    g.pause(); return { slip: !!g.race.slip, text: el.textContent, out }; });
  const on = s.out.filter(x => x.on), wrong = s.out.filter(x => (x.tow > 0.35 && !x.on) || (x.tow < 0.1 && x.on));
  T.check('a race with rivals: the slipstream on; in the wake of a car ahead ZAVETRJE lit, out of it not', s.slip && s.text === 'ZAVETRJE' && on.length >= 2 && on.length < s.out.length && wrong.length === 0,
    JSON.stringify({ slip: s.slip, text: s.text, on: on.length, of: s.out.length, wrong: wrong.slice(0, 5) }));
  const en = await page.evaluate(() => { const g = window.__game; g.onAction('to-settings'); document.querySelector('[data-set="lang"] button[data-v="en"]').click(); const t = document.getElementById('h-tow').textContent;
    document.querySelector('[data-set="lang"] button[data-v="sl"]').click(); g.onAction('settings-done'); return t; });
  T.check('in English: SLIPSTREAM', en === 'SLIPSTREAM', en);
  await page.evaluate(() => { const g = window.__game; g.resume(); g.onAction('to-title'); });
  await startTrack(page, 'pikes');
  const tt = await page.evaluate(() => { const g = window.__game; g.pause(); g.sim(3, true); g.resume(); return { slip: !!g.race.slip, tow: 'tow' in g.race.player, on: getComputedStyle(document.getElementById('h-tow')).display !== 'none' }; });
  T.check('a time trial (Pikes Peak): no slipstream', !tt.slip && !tt.tow && !tt.on, JSON.stringify(tt));
  T.check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
} catch (e) {
  T.check('the test ran through', false, String(e && e.message || e).split('\n')[0]);
} finally {
  await browser.close(); await srv.close();
}
T.done();
