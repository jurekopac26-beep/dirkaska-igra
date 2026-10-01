// The timing tower and the lap table: a race at Jezero Ring (13 cars, on autopilot): upright, the tower under the place in the left
// column: the leader (VODI), the first three and the player with the two ahead and behind, the gaps growing down the order, the player's
// row lit; switched off in the settings: gone. On its side: at the right under the map, the player with one ahead and behind. The results:
// every driver's laps (3 each for those at the line), the race's fastest lap in purple once, the pit stops.
//   node tests/browser/tower.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('tower');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', track: 'jezero', tower: 1 }, { width: 390, height: 844 }, { seed: 7 });
  await startTrack(page, 'jezero');
  await page.evaluate(() => { const g = window.__game; g.pause(); g.sim(22, true); g.resume(); });
  // (the tower is drawn four times a second of the race; a slow software renderer takes a few frames to get there: read it once it shows
  // the order as it is now)
  const read = () => { const g = window.__game, P = g.race.player, H = document.getElementById('h-tower'), r = H.getBoundingClientRect(), k = document.getElementById('h-rank').getBoundingClientRect();
    const rows = [...H.querySelectorAll('.tw-r')].map(e => ({ pos: +e.querySelector('b').textContent, code: e.querySelector('span').textContent, gap: e.querySelector('em').textContent, me: e.classList.contains('me') }));
    return { rows, sep: H.querySelectorAll('.tw-sep').length, pos: P.pos, n: g.race.cars.length, left: r.left, top: r.top, colBottom: k.bottom, visible: getComputedStyle(H).display !== 'none' }; };
  const t1 = await page.waitForFunction((src) => { const t = (0, eval)(src)(), me = t.rows.find(x => x.me); return me && me.pos === t.pos && t.rows.some(x => /^\+\d/.test(x.gap)) && t; }, read.toString(), { timeout: 20000 })
    .then(h => h.jsonValue()).catch(() => page.evaluate((src) => (0, eval)(src)(), read.toString()));
  const r = t1.rows, me = r.find(x => x.me), gaps = r.filter(x => /^\+\d/.test(x.gap)).map(x => parseFloat(x.gap.slice(1)));
  const want = t1.pos <= 6 ? 8 : 8;   // (3 first + the player with two ahead and two behind: 8 rows whether the blocks meet or not)
  T.check('upright: the tower in the left column, the leader (VODI), the first three, the player (TI, lit) with two ahead and behind', t1.visible && t1.left < 60 && r.length >= 7 && r.length <= want && r[0].pos === 1 && r[0].gap === 'VODI' && r[1].pos === 2 && r[2].pos === 3 && me && me.code === 'TI' && me.pos === t1.pos &&
    r.some(x => x.pos === Math.min(t1.n, t1.pos + 2)) && (t1.pos - 2 <= 4 || t1.sep === 1), JSON.stringify(t1));
  T.check('the gaps to the leader grow down the order (+s.s), other drivers by three letters', gaps.length >= 4 && gaps.every((v, i) => i === 0 || v >= gaps[i - 1] - 0.3) && r.filter(x => !x.me).every(x => /^[A-ZČŠŽ]{3}$/.test(x.code)), JSON.stringify(r));
  await page.evaluate(() => { window.__game.onAction('to-settings'); document.querySelector('[data-set="tower"] button[data-v="0"]').click(); window.__game.onAction('settings-done'); });
  await page.waitForTimeout(300);
  const off = await page.evaluate(() => getComputedStyle(document.getElementById('h-tower')).display);
  await page.evaluate(() => { document.querySelector('[data-set="tower"] button[data-v="1"]').click(); window.__game.resume(); });
  T.check('switched off in the settings: gone', off === 'none', off);

  // on its side: at the right, under the map
  await page.setViewportSize({ width: 844, height: 390 });
  const read2 = () => { const H = document.getElementById('h-tower'), r = H.getBoundingClientRect(), m = document.getElementById('h-map').getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, mapBottom: m.bottom, mapLeft: m.left, rows: H.querySelectorAll('.tw-r').length, w: innerWidth, h: innerHeight }; };
  const t2 = await page.waitForFunction((src) => { const t = (0, eval)(src)(); return t.rows <= 7 && t; }, read2.toString(), { timeout: 20000 })   // (drawn again at its next quarter of a second)
    .then(h => h.jsonValue()).catch(() => page.evaluate((src) => (0, eval)(src)(), read2.toString()));
  T.check('on its side: at the right under the map, clear of the pedals (at most 7 rows)', t2.left >= t2.mapLeft - 2 && t2.top >= t2.mapBottom && t2.bottom < t2.h * 0.66 && t2.rows >= 5 && t2.rows <= 7, JSON.stringify(t2));
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(300);

  // the results: every driver's laps
  await page.evaluate(() => { const g = window.__game; g.pause(); for (let k = 0; k < 300 && g.phase !== 'done'; k++) g.sim(2, true); if (g.phase !== 'done') g.resume(); });
  await page.waitForFunction(() => window.__game.screen === 'results', null, { timeout: 180000 });
  const lt = await page.evaluate(() => { const E = document.getElementById('res-laps'), rows = [...E.querySelectorAll('tbody tr')];
    return { shown: !E.classList.contains('off'), head: [...E.querySelectorAll('thead th')].map(t => t.textContent), rows: rows.length, laps: rows.map(tr => [...tr.querySelectorAll('td')].slice(2, 5).filter(td => /^\d+:\d\d\.\d{3}$/.test(td.textContent)).length),
      purple: E.querySelectorAll('td.ob').length, green: E.querySelectorAll('td.pb').length, me: !!E.querySelector('tr.me'), stops: rows.map(tr => tr.lastElementChild.textContent) }; });
  T.check('the results: every driver\'s laps (K1-K3), the fastest of the race once in purple, each best in green, the pit stops', lt.shown && lt.head.join() === '#,Voznik,K1,K2,K3,Postanki' && lt.rows === 13 && lt.laps.filter(n => n === 3).length >= 1 && lt.purple === 1 && lt.green >= 5 && lt.me && lt.stops.every(s => /^\d+$/.test(s)), JSON.stringify(lt));

  T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
