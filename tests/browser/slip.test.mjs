// The slipstream in the game: a race at the Red Bull Ring (21 rivals, the player on autopilot) has it; in the wake of a car ahead the
// car's tow rises, out of it it falls (no ZAVETRJE tag on the screen any more). A time trial has none (Pikes Peak).
//   node tests/browser/slip.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('slipstream');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', track: 'rbring' }, { width: 390, height: 844 }, { seed: 7 });
  await startTrack(page, 'rbring');
  // (stepped in 0.4 s pieces; the tag ZAVETRJE is gone from the screen, the user's decision: the slipstream itself works as before)
  const s = await page.evaluate(async () => { const g = window.__game, P = g.race.player, out = [];
    for (let k = 0; k < 120; k++) { g.pause(); g.sim(0.4, true); g.resume(); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); out.push(+(P.tow || 0).toFixed(2)); }
    g.pause(); return { slip: !!g.race.slip, tag: !!document.getElementById('h-tow'), out }; });
  const inWake = s.out.filter(x => x > 0.35).length;
  T.check('a race with rivals: the slipstream works (in the wake of a car ahead, out of it not), no ZAVETRJE tag on the screen', s.slip && !s.tag && inWake >= 2 && inWake < s.out.length,
    JSON.stringify({ slip: s.slip, tag: s.tag, inWake, of: s.out.length }));
  await page.evaluate(() => { const g = window.__game; g.resume(); g.onAction('to-title'); });
  await startTrack(page, 'pikes', 'tt');
  const tt = await page.evaluate(() => { const g = window.__game; g.pause(); g.sim(3, true); g.resume(); return { slip: !!g.race.slip, tow: 'tow' in g.race.player }; });
  T.check('a time trial (Pikes Peak): no slipstream', !tt.slip && !tt.tow, JSON.stringify(tt));
  T.check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
} catch (e) {
  T.check('the test ran through', false, String(e && e.message || e).split('\n')[0]);
} finally {
  await browser.close(); await srv.close();
}
T.done();
