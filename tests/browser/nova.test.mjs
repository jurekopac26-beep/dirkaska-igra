// The driving physics in the settings (Nastavitve → Fizika vožnje: Klasična / Nova; js/game.js S.phys, Core's Car.stepNova):
// - the row is in the settings with both choices, Klasična marked on a fresh profile; in English "Driving physics: Classic / New"
// - Nova chosen: kept in the settings (localStorage), a race on Bathurst runs with the new physics for every car (the player's and the
//   rivals'), 20 s on the autopilot: nothing NaN, the cars moving, no errors on the page
// - switched back to Klasična during that race: the race keeps its physics, a toast says it applies from the next race; the next race classic
// - the row Slog nove fizike (Običajen marked on a fresh profile; in English "New physics style: Normal / Sliding"): Drseč chosen with Nova,
//   the next race's player car has the sliding style (Car.nvSl), the rivals not; with Klasična no car has it
//   node tests/browser/nova.test.mjs
import { serve, launch, openGame, startTrack, simulate, checker } from './lib.mjs';

const T = checker('nova');
const srv = await serve();
const browser = await launch();
const row = (page) => page.evaluate(() => { const s = document.querySelector('#s-settings [data-set="phys"]'), r = s && s.closest('.row');
  return s ? { label: r.querySelector('.rlbl').textContent, btns: [...s.querySelectorAll('button')].map(b => b.dataset.v + ':' + b.textContent + (b.classList.contains('sel') ? '*' : '')) } : null; });
const rowS = (page) => page.evaluate(() => { const s = document.querySelector('#s-settings [data-set="slide"]'), r = s && s.closest('.row');
  return s ? { label: r.querySelector('.rlbl').textContent, btns: [...s.querySelectorAll('button')].map(b => b.dataset.v + ':' + b.textContent + (b.classList.contains('sel') ? '*' : '')) } : null; });
const saved = (page) => page.evaluate(() => { try { return JSON.parse(localStorage.getItem('tdgp-settings') || '{}').phys; } catch (_) { return null; } });
try {
  {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', {}, { width: 640, height: 360 });
    await page.evaluate(() => window.__game.onAction('to-settings')); await page.waitForTimeout(300);
    const r = await row(page);
    T.check('settings: the row Fizika vožnje with Klasična (marked) and Nova', r && r.label === 'Fizika vožnje' && r.btns.join(',') === 'cs:Klasična*,nova:Nova', JSON.stringify(r));
    const r2 = await rowS(page);
    T.check('settings: the row Slog nove fizike with Običajen (marked) and Drseč', r2 && r2.label === 'Slog nove fizike' && r2.btns.join(',') === '0:Običajen*,1:Drseč', JSON.stringify(r2));
    await page.click('#s-settings [data-set="lang"] [data-v="en"]'); await page.waitForTimeout(300);
    const e = await row(page);
    T.check('settings in English: Driving physics, Classic / New', e && e.label === 'Driving physics' && e.btns.join(',') === 'cs:Classic*,nova:New', JSON.stringify(e));
    const e2 = await rowS(page);
    T.check('settings in English: New physics style, Normal / Sliding', e2 && e2.label === 'New physics style' && e2.btns.join(',') === '0:Normal*,1:Sliding', JSON.stringify(e2));
    await page.click('#s-settings [data-set="lang"] [data-v="sl"]'); await page.waitForTimeout(200);
    await page.click('#s-settings [data-set="phys"] [data-v="nova"]'); await page.waitForTimeout(200);
    T.check('Nova chosen: marked and kept in the settings', (await row(page)).btns.join(',') === 'cs:Klasična,nova:Nova*' && await saved(page) === 'nova');
    await startTrack(page, 'bathurst');
    const nan = await simulate(page, 20);
    const st = await page.evaluate(() => { const r = window.__game.race; return { phys: r.opts.phys, cars: r.cars.map(c => c.phys), moving: r.cars.filter(c => c.speed > 5).length, n: r.cars.length, t: r.time }; });
    T.check('a race on Bathurst with Nova: every car (the player and the rivals) drives the new physics', st.phys === 'nova' && st.cars.length > 10 && st.cars.every(p => p === 'nova'), JSON.stringify({ phys: st.phys, cars: [...new Set(st.cars)] }));
    T.check('20 s on the autopilot: nothing NaN, the cars moving', !nan && st.moving >= st.n - 1, `${st.moving} of ${st.n} moving at ${st.t.toFixed(1)} s`);
    // back to Klasična during the race: the race keeps its physics, a toast; the next race classic
    await page.evaluate(() => window.__game.onAction('to-settings')); await page.waitForTimeout(300);
    await page.click('#s-settings [data-set="phys"] [data-v="cs"]'); await page.waitForTimeout(200);
    const tt = await page.evaluate(() => ({ toast: document.getElementById('toast').textContent, phys: window.__game.race.opts.phys, cars: [...new Set(window.__game.race.cars.map(c => c.phys))] }));
    T.check('Klasična during the race: the race keeps the new physics, a toast says it applies from the next race', tt.phys === 'nova' && tt.cars.join() === 'nova' && /naslednje dirke/.test(tt.toast), JSON.stringify(tt));
    await startTrack(page, 'spa');
    const nx = await page.evaluate(() => ({ phys: window.__game.race.opts.phys, cars: [...new Set(window.__game.race.cars.map(c => c.phys))] }));
    T.check('the next race (Spa): the classic physics', nx.phys === 'cs' && nx.cars.join() === 'cs' && await saved(page) === 'cs', JSON.stringify(nx));
    // the sliding style: Drseč with Klasična, no car has it; with Nova the player's car only
    await page.evaluate(() => window.__game.onAction('to-settings')); await page.waitForTimeout(300);
    await page.click('#s-settings [data-set="slide"] [data-v="1"]'); await page.waitForTimeout(200);
    await startTrack(page, 'spa');
    const sc = await page.evaluate(() => window.__game.race.cars.filter(c => c.nvSl).length);
    await page.evaluate(() => window.__game.onAction('to-settings')); await page.waitForTimeout(300);
    await page.click('#s-settings [data-set="phys"] [data-v="nova"]'); await page.waitForTimeout(200);
    await startTrack(page, 'bathurst');
    const sn = await page.evaluate(() => { const r = window.__game.race; return { player: !!r.player.nvSl, rivals: r.cars.filter(c => !c.isPlayer && c.nvSl).length, phys: r.opts.phys }; });
    const nan2 = await simulate(page, 8);
    T.check('Slog nove fizike: Drseč: with Nova the player\'s car slides (Car.nvSl), the rivals not; with Klasična no car; 8 s on the autopilot without NaN',
      sc === 0 && sn.player && sn.rivals === 0 && sn.phys === 'nova' && !nan2, JSON.stringify({ classic: sc, nova: sn, nan: nan2 }));
    T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
} finally {
  await browser.close(); await srv.close();
}
T.done();
