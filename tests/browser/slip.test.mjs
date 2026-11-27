// The slipstream in the game: a race at the Red Bull Ring (21 rivals, the player on autopilot) has it; in the wake of a car ahead the
// car's tow rises, out of it it falls (no ZAVETRJE tag on the screen any more). A time trial has none (Pikes Peak). Nastavitve: Zavetrje
// (S.tow, Izklop by default since 20. 11. 2026; the race above with Močno, the strength of before) switched off: the next race has none, for any car (the
// user, 18. 11. 2026 ~23.45, through Matej: table #382, comment 6992562620).
//   node tests/browser/slip.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('slipstream');
const srv = await serve();
const browser = await launch();
try {
  // (the game's test mode, ?proga=rbring&t=1&seme=7: the race draws its random numbers from its seed (Race opts.repro) and its start is
  // stepped paused (quickRun), the same race every run, on any machine, as in pitahead.test.mjs. Started from the menus, it drew from the
  // page's Math.random, as the drawn frames do, and its start ran on real frames with the player's car off the gas: another race each run,
  // in CI out of every wake again once the pieces were paused (inWake 0, #583 run 42705658688, docs/nestabilni-testi.md)
  const { page, errors } = await openGame(browser, srv.base + '/index.html?proga=rbring&t=1&seme=7', { quality: 'normal', shadows: 0, camera: 'chase', tow: 3 }, { width: 390, height: 844 }, { seed: 7 });
  await page.waitForFunction(() => window.__game.quick && window.__game.quick.done, null, { timeout: 240000 });
  // (stepped in 0.4 s pieces; the tag ZAVETRJE is gone from the screen, the user's decision: the slipstream itself works as before. The
  // race paused throughout, two frames drawn after each piece: resumed for them, the race ran on real frames with the player's own empty
  // inputs, no gas and no steering, 14-15 s of the 53 with the CPU busy, the car last and out of every wake: inWake 0 in CI, docs/nestabilni-testi.md.
  // The player's car stuck or the wrong way round for over 3 s is put back on the road, as a player taps Na progo: the race rescues only the rivals)
  const s = await page.evaluate(async () => { const g = window.__game, R = g.race, P = R.player, out = []; let rescued = 0;
    for (let k = 0; k < 120; k++) {
      g.pause(); g.sim(0.4, true); if (!P.inPit && !P.finished && (P.stuckT > 3 || P.wrongT > 3)) { R.rescue(P); rescued++; } g.hud(0.4);
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); out.push(+(P.tow || 0).toFixed(2));
    }
    g.pause(); return { slip: !!R.slip, lv: R.slip && R.slip.lv, tag: !!document.getElementById('h-tow'), out, pos: P.pos, cars: R.cars.length, rescued }; });
  const inWake = s.out.filter(x => x > 0.35).length;
  T.check('a race with rivals: the slipstream works (in the wake of a car ahead, out of it not), no ZAVETRJE tag on the screen', s.slip && !s.tag && inWake >= 2 && inWake < s.out.length,
    JSON.stringify({ slip: s.slip, tag: s.tag, inWake, of: s.out.length, pos: s.pos + '/' + s.cars, rescued: s.rescued }));
  await page.evaluate(() => { const g = window.__game; g.resume(); g.onAction('to-title'); });
  await startTrack(page, 'pikes', 'tt');
  const tt = await page.evaluate(() => { const g = window.__game; g.pause(); g.sim(3, true); g.resume(); return { slip: !!g.race.slip, tow: 'tow' in g.race.player }; });
  T.check('a time trial (Pikes Peak): no slipstream', !tt.slip && !tt.tow, JSON.stringify(tt));
  // Nastavitve: Zavetrje off: a race with rivals without the slipstream, no car with a tow (race.slip null), the choice kept
  // (the default, the user's of 20. 11. 2026: off; the race above with Močno, the strength of before)
  const def = await page.evaluate((k) => ({ lv: [...document.querySelectorAll('[data-set="tow"] button')].map(b => b.textContent).join('/'), k }), s.lv);
  await page.evaluate(() => { const g = window.__game; g.onAction('to-title'); g.onAction('to-settings'); document.querySelector('[data-set="tow"] button[data-v="0"]').click(); g.onAction('settings-done'); });
  await startTrack(page, 'rbring');
  const off = await page.evaluate(() => { const g = window.__game; g.pause(); g.sim(3, true); g.resume(); const R = g.race;
    return { slip: R.slip, cars: R.cars.length, tow: R.cars.filter(c => 'tow' in c).length, stored: JSON.parse(localStorage.getItem('tdgp-settings')).tow }; });
  T.check('Nastavitve: Zavetrje Izklop/Šibko/Srednje/Močno; off: a race with rivals without it (race.slip null, no car with a tow), the choice kept',
    def.lv === 'Izklop/Šibko/Srednje/Močno' && def.k === 1 && off.slip === null && off.cars > 1 && off.tow === 0 && off.stored === 0, JSON.stringify(Object.assign({ def }, off)));
  T.check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
} catch (e) {
  T.check('the test ran through', false, String(e && e.message || e).split('\n')[0]);
} finally {
  await browser.close(); await srv.close();
}
T.done();
