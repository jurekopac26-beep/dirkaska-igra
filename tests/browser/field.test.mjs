// The way to the start and the field of a race (Izberi progo: Pred dirko, Tekmovalci): a fresh profile goes straight to the race (no
// qualifying) with 22 cars (the HUD: place /22, 21 rivals on the title); the two rows on the track screen (Takoj na tekmo | Kvalifikacije,
// 6 | 12 | 16 | 22) change the setting and the next race, kept; qualifying with the full field has 21 rivals' laps to wait for; a profile
// from before (qualifying on, 13 cars) is moved to the new defaults once and is the player's own after that; a track's own full field (the
// Nürburgring's 20) gives way to the field chosen.
//   node tests/browser/field.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('the field of a race');
const srv = await serve();
const browser = await launch();
const VP = { width: 390, height: 844 };
const wait = (ms) => new Promise(r => setTimeout(r, ms));
try {
  // 1. a fresh profile: the new defaults, the two rows, a race of 22 cars at once
  {
    const { page, errors } = await openGame(browser, srv.base + '/index.html', null, VP, { seed: 7 });
    const d = await page.evaluate(() => ({ quali: window.__game.S.quali, field: window.__game.S.field }));
    T.check('a fresh profile: no qualifying, a field of 22', d.quali === 0 && d.field === 22, JSON.stringify(d));
    await page.evaluate(async () => { const g = window.__game, w = (ms) => new Promise(r => setTimeout(r, ms)); g.onAction('to-track'); await w(300); });
    const rows = await page.evaluate(() => { const row = (k) => [...document.querySelectorAll(`[data-set="${k}"] button`)].map(b => b.textContent + (b.classList.contains('sel') ? '*' : ''));
      return { quali: row('quali'), field: row('field'), lbl: [...document.querySelectorAll('#s-track .rlbl')].map(e => e.textContent) }; });
    T.check('Izberi progo: "Pred dirko" (Takoj na tekmo*, Kvalifikacije) and "Tekmovalci" (6, 12, 16, 22*)', rows.quali.join() === 'Takoj na tekmo*,Kvalifikacije' && rows.field.join() === '6,12,16,22*' && rows.lbl.includes('Pred dirko') && rows.lbl.includes('Tekmovalci'), JSON.stringify(rows));
    await startTrack(page, 'jezero');
    await page.evaluate(() => { const g = window.__game; g.pause(); g.sim(8, true); g.resume(); });
    await page.waitForTimeout(500);
    const r1 = await page.evaluate(() => { const g = window.__game; return { cars: g.race.cars.length, quali: !!g.race.quali, grid: g.race.player.grid, tot: document.getElementById('h-tot').textContent, rivals: g.race.cars.filter(c => !c.isPlayer).length,
      names: new Set(g.race.cars.map(c => c.name)).size, nums: new Set(g.race.cars.map(c => c.num)).size }; });
    T.check('Start: straight to the race, 22 cars (the player 12th), every name and number once, the HUD "/22"', r1.cars === 22 && !r1.quali && r1.grid === 12 && r1.tot === '/22' && r1.names === 22 && r1.nums === 22, JSON.stringify(r1));
    const sub = await page.evaluate(async () => { window.__game.onAction('to-title'); await new Promise(r => setTimeout(r, 300)); return document.getElementById('title-sub').textContent; });
    T.check('the title says 21 rivals', /21 nasprotnikov/.test(sub), sub);

    // 2. the buttons: a smaller field, kept; the next race has that many cars
    for (const n of [6, 16]) {
      await page.evaluate(async (n) => { const g = window.__game, w = (ms) => new Promise(r => setTimeout(r, ms)); g.onAction('to-title'); await w(250); g.onAction('to-track'); await w(300);
        document.querySelector(`[data-set="field"] button[data-v="${n}"]`).click(); await w(150); }, n);
      const sel = await page.evaluate(() => ({ S: window.__game.S.field, saved: JSON.parse(localStorage.getItem('tdgp-settings')).field, on: [...document.querySelectorAll('[data-set="field"] button.sel')].map(b => b.textContent) }));
      await startTrack(page, 'jezero');
      const r2 = await page.evaluate(() => { const g = window.__game; return { cars: g.race.cars.length, grid: g.race.player.grid, tot: document.getElementById('h-tot').textContent }; });
      T.check(`${n} chosen: the button lit, kept, the next race has ${n} cars (the HUD "/${n}", the player ${Math.min(n, 12)}th)`, sel.S === n && sel.saved === n && sel.on.join() === String(n) && r2.cars === n && r2.tot === '/' + n && r2.grid === Math.min(n, 12), JSON.stringify({ sel, r2 }));
    }

    // 3. qualifying with the full field: 21 rivals' laps behind the player's
    await page.evaluate(async () => { const g = window.__game, w = (ms) => new Promise(r => setTimeout(r, ms)); g.onAction('to-title'); await w(250); g.onAction('to-track'); await w(300);
      document.querySelector('[data-set="field"] button[data-v="22"]').click(); document.querySelector('[data-set="quali"] button[data-v="1"]').click(); await w(150); });
    await startTrack(page, 'jezero');
    const q = await page.evaluate(() => { const g = window.__game; return { quali: !!g.race.quali, cars: g.race.cars.length, qn: g.qual && g.qual.n, sel: [...document.querySelectorAll('[data-set="quali"] button.sel')].map(b => b.textContent) }; });
    T.check('Kvalifikacije with the field of 22: the player alone on the track, 21 rivals\' laps to come', q.quali && q.cars === 1 && q.qn === 21 && q.sel.join() === 'Kvalifikacije', JSON.stringify(q));
    T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
    await page.context().close();
  }

  // 4. a profile from before (qualifying on, 13 cars, no flag of the new defaults): moved once; then the player's own choice stays
  {
    const ctx = await browser.newContext({ viewport: VP }), page = await ctx.newPage(), errors = [];
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    await page.addInitScript(() => { if (localStorage.getItem('tdgp-settings') === null) { localStorage.setItem('tdgp-defaults-v2', '1'); localStorage.setItem('tdgp-noadapt', '1'); localStorage.setItem('tdgp-settings', JSON.stringify({ sound: 0, comm: 0, quali: 1, field: 13 })); } });
    await page.goto(srv.base + '/index.html'); await page.waitForFunction(() => window.__game, null, { timeout: 180000 });
    const m1 = await page.evaluate(() => ({ quali: window.__game.S.quali, field: window.__game.S.field, flag: localStorage.getItem('tdgp-defaults-v3'), saved: JSON.parse(localStorage.getItem('tdgp-settings')) }));
    T.check('an old profile (qualifying on, 13 cars): moved to the new defaults once (no qualifying, 22), the move remembered', m1.quali === 0 && m1.field === 22 && m1.flag === '1' && m1.saved.quali === 0 && m1.saved.field === 22, JSON.stringify(m1));
    await page.evaluate(async () => { const g = window.__game, w = (ms) => new Promise(r => setTimeout(r, ms)); g.onAction('to-track'); await w(300); document.querySelector('[data-set="quali"] button[data-v="1"]').click(); document.querySelector('[data-set="field"] button[data-v="12"]').click(); await w(150); });
    await page.reload(); await page.waitForFunction(() => window.__game, null, { timeout: 180000 });
    const m2 = await page.evaluate(() => ({ quali: window.__game.S.quali, field: window.__game.S.field }));
    T.check('and after that the player\'s own choice stays (qualifying on, 12 cars after a reload)', m2.quali === 1 && m2.field === 12, JSON.stringify(m2));
    // a hand-edited field is brought back into 2 .. 22
    await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('tdgp-settings')); s.field = 500; localStorage.setItem('tdgp-settings', JSON.stringify(s)); });
    await page.reload(); await page.waitForFunction(() => window.__game, null, { timeout: 180000 });
    T.check('a field written by hand (500) comes back as 22', await page.evaluate(() => window.__game.S.field) === 22);
    T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
    await ctx.close();
  }

  // 5. a track's own full field (the Nürburgring: 20 rivals) gives way to the field chosen
  {
    const { page, errors } = await openGame(browser, srv.base + '/index.html', { field: 12 }, VP, { seed: 7 });
    await startTrack(page, 'nring');
    const n = await page.evaluate(() => window.__game.race.cars.length);
    T.check('Nürburgring with a field of 12: 12 cars (not its own 21)', n === 12, 'cars ' + n);
    T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
    await page.context().close();
  }
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
