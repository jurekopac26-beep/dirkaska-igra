// Zabava (docs/zabava.md) in the game: the novelties switched on for this test (window.__zabava), each one in a race of its own.
//   1. the system: the game loads with them, a race runs with no errors; the team's goals (career): the card before the lights holds
//      the race on the grid until a choice, the choice starts it, the pay at the finish through the career; no card outside the career
//   2. the elimination race (?nacin=elim): the countdown, the first cut, the end and its results
//   node tests/browser/zabava.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('zabava');
const srv = await serve();
const browser = await launch();
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const there = (page) => page.waitForFunction(() => window.__game.quick && window.__game.quick.done, null, { timeout: 240000 });
const CAREER = JSON.stringify({ v: 1, on: true, money: 10000, cars: ['pico'], upg: {}, earned: 0, races: 0, wins: 0 });
const on = (more) => `window.__zabava = true; ${more || ''}`;

try {
  // 1. the team's goals in the career: Bathurst in the PICO TURBO, the card before the lights
  {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?proga=bathurst&avto=pico', {}, { width: 412, height: 892 }, { menu: true, init: on(`localStorage.setItem('tdgp-career', ${JSON.stringify(CAREER)});`) });
    await there(page);
    await page.waitForSelector('#zb-card', { timeout: 60000 });
    await wait(2500);
    const s1 = await page.evaluate(() => ({ phase: window.__game.phase, items: [...document.querySelectorAll('#zb-card .zb-ci')].map(b => b.textContent), title: document.querySelector('#zb-card .zb-ct').textContent, focus: document.activeElement && document.activeElement.classList.contains('zb-ci') }));
    T.check('career race: the card CILJ EKIPE with three goals and Brez cilja, the first one focused', s1.title === 'CILJ EKIPE' && s1.items.length === 4 && /Brez cilja/.test(s1.items[3]) && s1.items.slice(0, 3).every(t => /\+\d+ %/.test(t)) && s1.focus, JSON.stringify(s1));
    T.check('the race waits on the grid while the card is open (still the intro after 2.5 s)', s1.phase === 'intro', s1.phase);
    await page.click('#zb-card .zb-ci');
    await page.waitForFunction(() => window.__game.phase === 'lights' || window.__game.phase === 'racing', null, { timeout: 30000 });
    const s2 = await page.evaluate(() => { const f = Zabava.list.find(x => x.id === 'cilji'); return { card: !!document.getElementById('zb-card'), goal: f.goal && f.goal.k, phase: window.__game.phase }; });
    T.check('the first goal chosen: the card gone, the goal kept, the lights come on', !s2.card && !!s2.goal && ['lights', 'racing'].includes(s2.phase), JSON.stringify(s2));
    // the pay: a win with the win's goal (+50 % of 6000 EUR) goes onto the career's account
    const s3 = await page.evaluate(() => {
      const f = Zabava.list.find(x => x.id === 'cilji'); f.goal = f.GOALS.find(g => g.k === 'zmaga');
      const before = JSON.parse(localStorage.getItem('tdgp-career')).money;
      const t = f.resPay(window.__game.race, { pos: 1, n: 22, out: false, prize: 6000, fl: false, grid: 22, res: [] });
      return { t, d: JSON.parse(localStorage.getItem('tdgp-career')).money - before };
    });
    T.check('a reached goal pays its share through the career (+3.000 €)', s3.d === 3000 && /Cilj ekipe: \+3\.000/.test(s3.t), JSON.stringify(s3));
    T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
  // 2. outside the career: no card, the race goes on to the lights by itself
  {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?proga=bathurst', {}, { width: 640, height: 360 }, { menu: true, init: on() });
    await there(page);
    await page.waitForFunction(() => window.__game.phase === 'lights' || window.__game.phase === 'racing', null, { timeout: 60000 });
    const s = await page.evaluate(() => ({ card: !!document.getElementById('zb-card'), zb: typeof Zabava, n: Zabava.list.length }));
    T.check('no career: no card, the lights come on', !s.card && s.zb === 'object' && s.n >= 1, JSON.stringify(s));
    await page.evaluate(async () => { for (let i = 0; i < 10; i++) { window.__game.sim(1, true); await new Promise(r => requestAnimationFrame(r)); } });
    T.check('10 s of the race with the novelties on: no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
  // 3. the elimination race: Bathurst (?nacin=elim), 22 cars, the countdown under the time, the first cut at 45 s, the end, the results
  {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?proga=bathurst&nacin=elim', {}, { width: 412, height: 892 }, { menu: true });
    await there(page);
    await page.waitForFunction(() => window.__game.phase === 'racing', null, { timeout: 90000 });
    const s0 = await page.evaluate(() => { const r = window.__game.race; return { mode: r.zbMode, n: r.cars.length, grid: r.player.grid, line: document.getElementById('hud').classList.contains('zb-line'), laps: r.laps }; });
    T.check('?nacin=elim on Bathurst: the elimination race, 22 cars, the player 11th, the line under the time on', s0.mode === 'elim' && s0.n === 22 && s0.grid === 11 && s0.line && s0.laps >= 3, JSON.stringify(s0));
    await page.evaluate(async () => { const g = window.__game; for (let i = 0; i < 40; i++) { g.sim(1, true); await new Promise(r => requestAnimationFrame(r)); } });
    const s1 = await page.evaluate(() => ({ gap: document.getElementById('h-gap').textContent, vis: getComputedStyle(document.getElementById('h-gap')).display, red: document.querySelectorAll('#h-tower .tw-r.zb-out').length }));
    T.check('at 40 s: the countdown under the time (IZLOČITEV ČEZ … s or NEVARNO!), shown; the timing tower has the red row of the first car in danger', /(^IZLOČITEV ČEZ \d+ s$|^NEVARNO! IZPADEŠ ČEZ \d+ s$)/.test(s1.gap) && s1.vis === 'block' && s1.red >= 1, JSON.stringify(s1));
    await page.evaluate(async () => { const g = window.__game; for (let i = 0; i < 7; i++) { g.sim(1, true); await new Promise(r => requestAnimationFrame(r)); } });
    const s2 = await page.evaluate(() => { const r = window.__game.race; return { out: r.cars.filter(c => c.zbOut).length, tot: document.getElementById('h-tot').textContent, word: document.getElementById('h-tower').textContent.includes('IZPADEL') || r.cars.filter(c => c.zbOut).some(c => c.isPlayer) }; });
    T.check('after the first cut (47 s): 2 cars out, 20 in (/20 by the place)', s2.out === 2 && s2.tot === '/20', JSON.stringify(s2));
    // the rest of the cuts at once (no driving): to the end; the results after the finish's seconds
    await page.evaluate(() => { const f = Zabava.list.find(x => x.id === 'elim'), r = window.__game.race; let k = 0; while (!f.st.end && k++ < 30) f.cut(r, f.alive(r)); });
    await page.evaluate(async () => { const g = window.__game; for (let i = 0; i < 8 && g.screen !== 'results'; i++) { g.sim(1, true); await new Promise(r => requestAnimationFrame(r)); } });
    await page.waitForFunction(() => window.__game.screen === 'results', null, { timeout: 30000 });
    const s3 = await page.evaluate(() => ({ title: document.getElementById('res-title').textContent, sub: document.getElementById('res-sub').textContent, rows: [...document.querySelectorAll('#res-table tbody tr')].map(tr => tr.textContent), out: window.__game.race.player.zbOut, nOut: window.__game.race.cars.filter(c => c.zbOut).length }));
    T.check('the results: Izpadel (with the place and when) or Zmaga! (survived every cut); 22 rows, the cars out say Izpadel', (s3.out ? s3.title === 'Izpadel' && /Izpadel si po .* na \d+\. mestu/.test(s3.sub) : s3.title === 'Zmaga!' && /Preživel si vse izločitve/.test(s3.sub)) && s3.rows.length === 22 && s3.rows.filter(t => /Izpadel/.test(t)).length === s3.nOut && s3.nOut >= 2, JSON.stringify({ t: s3.title, sub: s3.sub.slice(0, 120), n: s3.rows.length }));
    T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
} catch (e) {
  T.check('the test ran to its end', false, String(e && e.stack || e).slice(0, 600));
} finally {
  await browser.close(); await srv.close();
}
T.done();
