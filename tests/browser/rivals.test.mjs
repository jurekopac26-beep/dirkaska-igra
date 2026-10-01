// The rivals' characters in the game: the career's standing rival (not chosen yet on the career screen; after the first race the driver
// just ahead of the player, with its character in words, on the results and the career screen); in the next race that driver's car
// carries its name, and at the line the head-to-head is counted. A duel with the player and a mistake under pressure near the player on
// the HUD (the rival's duel its own message).
//   node tests/browser/rivals.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('rivals');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', track: 'jezero', weather: 'dry', tod: 'day' }, { width: 390, height: 844 }, { seed: 5 });
  const act = (a) => page.evaluate((a) => window.__game.onAction(a), a);
  const toEnd = () => page.evaluate(() => { const g = window.__game; g.pause(); for (let k = 0; k < 300 && g.phase !== 'done'; k++) g.sim(2, true); if (g.phase !== 'done') g.resume(); });
  await page.evaluate(() => { window.__msgs = []; new MutationObserver(() => { const t = document.getElementById('h-msg').textContent; if (t) window.__msgs.push(t); }).observe(document.getElementById('h-msg'), { childList: true, characterData: true, subtree: true }); });

  // 1. the career: no rival yet
  await act('to-career'); await page.waitForTimeout(150); await act('career-toggle'); await page.waitForTimeout(150);
  const r0 = await page.evaluate(() => document.getElementById('career-rival').textContent);
  T.check('the career screen: the standing rival chosen after the first race', r0 === 'Stalni tekmec: izbran bo po prvi dirki v karieri.', r0);

  // 2. the first race: the driver just ahead becomes the rival
  await startTrack(page, 'jezero');
  const chars = await page.evaluate(() => window.__game.race.cars.filter(c => c.chr).map(c => c.name + ' ' + c.chr.agg + '/' + c.chr.err));
  await toEnd(); await page.waitForFunction(() => window.__game.screen === 'results', null, { timeout: 180000 });
  const f1 = await page.evaluate(() => { const g = window.__game, rows = [...document.querySelectorAll('#res-table tbody tr')].map(tr => tr.children[1].textContent);
    return { sub: document.getElementById('res-sub').textContent, rival: g.career.rival, name: g.career.rival && Core.DRIVER_NAMES[g.career.rival.k], rows, me: rows.indexOf('Ti') }; });
  T.check('in a race every rival has its character; after the first race of the career the driver just ahead is the standing rival (on the results, with its character)', chars.length === 12 &&
    f1.rival && f1.rival.me === 0 && f1.rival.him === 0 && f1.rows[f1.me > 0 ? f1.me - 1 : 1] === f1.name && new RegExp(f1.name.replace('.', '\\.') + ' \\((agresivna|previdna|uravnotežena) vožnja(, (popušča pod pritiskom|mirna kri))?\\) je zdaj tvoj stalni tekmec\\.').test(f1.sub), JSON.stringify({ f1, chars: chars.slice(0, 3) }));
  await act('to-title'); await act('to-career'); await page.waitForTimeout(150);
  const r1 = await page.evaluate(() => document.getElementById('career-rival').textContent);
  T.check('the career screen: the rival, its character, the head-to-head (ti 0, tekmec 0)', r1.startsWith('Stalni tekmec: ' + f1.name + ' (') && r1.endsWith(' · ti 0, tekmec 0.'), r1);

  // 3. the next race: the rival's car carries its name; the duel and a mistake on the HUD; the head-to-head at the line
  await startTrack(page, 'jezero');
  await page.evaluate(() => { const g = window.__game; g.pause(); g.sim(8, true); g.resume(); });
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  const s3 = await page.evaluate(() => { const R = window.__game.race, rv = R.cars.filter(c => c.chr && c.chr.rival); return { rv: rv.map(c => c.name), tags: Render.show.tags }; });
  T.check('the next race: that driver is the rival (one car), its name over its car', s3.rv.length === 1 && s3.rv[0] === f1.name && s3.tags.length === 1 && s3.tags[0] === f1.name, JSON.stringify(s3));
  const hud = await page.evaluate(async () => { const g = window.__game, R = g.race, P = R.player, rv = R.cars.find(c => c.chr && c.chr.rival), o = R.cars.filter(c => c.chr && !c.chr.rival).sort((a, b) => Math.abs(a.dist - P.dist) - Math.abs(b.dist - P.dist))[0];
    const one = async (k, c) => { window.__msgs.length = 0; R.chr.q.push({ k, c }); g.pause(); g.sim(0.05, true); g.resume(); await new Promise(r => requestAnimationFrame(r)); return window.__msgs.slice(); };
    return { duel: await one('duel', o), rvDuel: await one('duel', rv), mistake: await one('mistake', o), name: o.name }; });
  T.check('a duel with the player (DVOBOJ: NAME; with the rival its own message), a mistake near the player (NAPAKA: NAME)', hud.duel.includes('DVOBOJ: ' + hud.name.toUpperCase()) && hud.rvDuel.includes('DVOBOJ S STALNIM TEKMECEM') && hud.mistake.includes('NAPAKA: ' + hud.name.toUpperCase()), JSON.stringify(hud));
  await toEnd(); await page.waitForFunction(() => window.__game.screen === 'results', null, { timeout: 180000 });
  const f3 = await page.evaluate(() => ({ sub: document.getElementById('res-sub').textContent, rival: window.__game.career.rival }));
  T.check('at the line: the head-to-head counted (the rival\'s place, overall ti / tekmec)', f3.rival.me + f3.rival.him === 1 && new RegExp(' Stalni tekmec ' + f1.name.replace('.', '\\.') + ': \\d+\\. mesto \\(skupaj ti ' + f3.rival.me + ', tekmec ' + f3.rival.him + '\\)\\.').test(f3.sub), JSON.stringify(f3));

  T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
