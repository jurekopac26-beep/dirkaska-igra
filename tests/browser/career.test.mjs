// The career (Kariera) through the menus: started from the title screen (10 000 EUR, the PICO TURBO in the garage, the money on the
// title button); the car screen (a car in the garage, a car with its price and "Kupi", too little money); upgrades bought (their
// prices, the money taken, bought parts cannot be sold); a race on autopilot pays the prize (the place, the distance, the difficulty,
// the fastest lap) on the results screen; a car bought with the money; a car not bought cannot race; the career off: the free game
// again (every car, its own free upgrades), on again: the money and the garage kept.
//   node tests/browser/career.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('career');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', track: 'jezero', car: 0 }, { width: 390, height: 844 });
  const act = (a) => page.evaluate((a) => window.__game.onAction(a), a);
  const txt = (id) => page.evaluate((id) => document.getElementById(id).textContent, id);
  const cr = () => page.evaluate(() => { const c = window.__game.career; return c && { on: c.on, money: c.money, cars: c.cars.slice(), upg: JSON.parse(JSON.stringify(c.upg)), races: c.races, wins: c.wins }; });
  const carIdx = (id) => page.evaluate((id) => Core.MODELS.findIndex(m => m.id === id), id);

  // 1. the title screen, the career screen, the start
  const b0 = await txt('btn-career');
  await act('to-career'); await page.waitForTimeout(200);
  const scr0 = await page.evaluate(() => ({ screen: window.__game.screen, toggle: document.getElementById('career-toggle').textContent, reset: document.getElementById('career-reset').classList.contains('off'), cars: document.querySelectorAll('#career-garage .gcar').length }));
  await act('career-toggle'); await page.waitForTimeout(200);
  const c1 = await cr(), scr1 = await page.evaluate(() => ({ toggle: document.getElementById('career-toggle').textContent, money: document.getElementById('career-money').textContent, own: [...document.querySelectorAll('#career-garage .gcar.own b')].map(b => b.textContent), car: window.__game.S.car }));
  T.check('career: started from its screen with 10.000 € and the PICO TURBO (the car chosen), the title button shows the money',
    b0 === 'Kariera' && scr0.screen === 'career' && scr0.toggle === 'Začni kariero' && scr0.reset && scr0.cars >= 6 && c1.on && c1.money === 10000 && c1.cars.join() === 'pico' && scr1.own.join() === 'PICO TURBO' && scr1.money === '10.000 €' && scr1.toggle === 'Izklopi kariero' && scr1.car === await carIdx('pico'),
    JSON.stringify({ b0, scr0, c1, scr1 }));
  await act('to-title'); await page.waitForTimeout(200);
  const b1 = await txt('btn-career');
  T.check('the title button: "Kariera · 10.000 €"', b1 === 'Kariera · 10.000 €', b1);

  // 2. the car screen: the car in the garage; another one with its price, too little money
  await act('to-car'); await page.waitForTimeout(300);
  const car = () => page.evaluate(() => ({ name: document.getElementById('car-name').textContent, price: document.getElementById('car-price').textContent, cls: document.getElementById('car-price').className, next: document.getElementById('car-next').textContent, act: document.getElementById('car-next').dataset.act, poor: document.getElementById('car-next').classList.contains('poor'), upg: !document.getElementById('btn-upg').classList.contains('off') }));
  const k0 = await car();
  T.check('car screen: the PICO TURBO in the garage, "Naprej"', k0.name === 'PICO TURBO' && /^V tvoji garaži · imaš 10\.000/.test(k0.price) && k0.act === 'to-track' && k0.next === 'Naprej' && k0.upg, JSON.stringify(k0));
  await page.evaluate(async () => { const g = window.__game; while (Core.MODELS[g.S.car].id !== 'kaze') { g.onAction('car-next'); await new Promise(r => setTimeout(r, 30)); } });
  const k1 = await car();
  await act('car-buy'); await page.waitForTimeout(150);
  const t1 = await txt('toast'), c2 = await cr();
  T.check('another car: its price and "Kupi · 30.000 €" (too little money: greyed, a message, nothing bought), no upgrades', k1.name === 'KAZE RS' && /^Cena 30\.000 € · imaš 10\.000/.test(k1.price) && k1.act === 'car-buy' && k1.next === 'Kupi · 30.000 €' && k1.poor && !k1.upg && /Premalo denarja/.test(t1) && c2.cars.join() === 'pico' && c2.money === 10000,
    JSON.stringify({ k1, t1 }));
  const blocked = await page.evaluate(async () => { const g = window.__game; g.onAction('to-track'); await new Promise(r => setTimeout(r, 200)); g.onAction('start'); await new Promise(r => setTimeout(r, 300)); return { race: !!(g.race && g.phase !== 'none' && g.race.player && g.race.player.m.id === 'kaze'), toast: document.getElementById('toast').textContent }; });
  T.check('a car not bought cannot race', !blocked.race && /Ta avto še ni tvoj/.test(blocked.toast), JSON.stringify(blocked));

  // 3. upgrades bought on the PICO TURBO: the prices, the money taken; a bought part cannot be sold
  await page.evaluate(async () => { const g = window.__game; g.onAction('to-car'); while (Core.MODELS[g.S.car].id !== 'pico') { g.onAction('car-next'); await new Promise(r => setTimeout(r, 30)); } g.onAction('to-upg'); await new Promise(r => setTimeout(r, 200)); });
  const u0 = await page.evaluate(() => ({ motor: [...document.querySelectorAll('[data-upg="motor"] button')].map(b => b.textContent), reset: document.querySelector('#s-upg [data-act="upg-reset"]').classList.contains('off') }));
  await page.evaluate(() => document.querySelector('[data-upg="motor"] button[data-lv="1"]').click()); await page.waitForTimeout(150);
  const c3 = await cr(), t3 = await txt('toast');
  await page.evaluate(() => document.querySelector('[data-upg="motor"] button[data-lv="0"]').click()); await page.waitForTimeout(150);
  const c3b = await cr(), t3b = await txt('toast');
  T.check('upgrades: the price of each level ("Stopnja 1 4.000 €", "Dirkalni 23.000 €": the levels in between too), bought (4.000 € taken, the level on), not sold back, no "Serijsko"',
    /^Stopnja 14\.000/.test(u0.motor[1]) && /^Dirkalni23\.000/.test(u0.motor[3]) && u0.reset && c3.money === 6000 && c3.upg.pico.motor === 1 && /Kupljeno: Motor/.test(t3) && c3b.upg.pico.motor === 1 && c3b.money === 6000 && /ne moreš prodati/.test(t3b),
    JSON.stringify({ u0, c3, t3, t3b }));
  await act('upg-done');

  // 4. a race on autopilot: the prize on the results screen
  await startTrack(page, 'jezero');
  const info = await page.evaluate(() => { const r = window.__game.race; return { len: r.track.len, laps: r.laps, n: r.cars.length, diff: window.__game.S.difficulty, upg: r.player.upg }; });
  await page.evaluate(() => { const g = window.__game; g.pause(); for (let k = 0; k < 300 && g.phase !== 'done'; k++) g.sim(2, true); if (g.phase !== 'done') g.resume(); });   // (done: the results screen is up, a resume would close it)
  await page.waitForFunction(() => window.__game.screen === 'results', null, { timeout: 180000 });
  const res = await page.evaluate(() => ({ sub: document.getElementById('res-sub').textContent, pos: parseInt(document.getElementById('res-pos').textContent, 10) }));
  const c4 = await cr();
  const prize = await page.evaluate((a) => Core.careerPrize(a.pos, a.n, a.len * a.laps, a.diff), { pos: res.pos, n: info.n, len: info.len, laps: info.laps, diff: info.diff });
  const got = c4.money - 6000, fl = /najhitrejšim krogom/.test(res.sub);
  T.check('the race pays: the prize for the place (+500 € for the fastest lap) on the results screen, in the money; the upgrade raced',
    got === prize + (fl ? 500 : 0) && got > 0 && new RegExp('Nagrada.*\\+' + String(got).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' € \\(imaš ').test(res.sub) && c4.races === 1 && info.upg.motor === 1,
    JSON.stringify({ res, prize, got, c4 }));

  // 5. a car bought (the money given for the test), raced
  await page.evaluate(() => { const c = window.__game.career; c.money = 35000; });
  await act('to-title'); await page.waitForTimeout(200); await act('to-car'); await page.waitForTimeout(200);
  await page.evaluate(async () => { const g = window.__game; while (Core.MODELS[g.S.car].id !== 'kaze') { g.onAction('car-next'); await new Promise(r => setTimeout(r, 30)); } });
  await act('car-buy'); await page.waitForTimeout(150);
  const c5 = await cr(), k5 = await car();
  T.check('a car bought: 30.000 € taken, in the garage, "Naprej"', c5.money === 5000 && c5.cars.includes('kaze') && k5.act === 'to-track' && /V tvoji garaži/.test(k5.price), JSON.stringify({ c5, k5 }));
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('tdgp-career')));
  T.check('the career kept in the browser', stored && stored.v === 1 && stored.money === 5000 && stored.cars.includes('kaze') && stored.upg.pico.motor === 1, JSON.stringify(stored));

  // 6. the career off: the free game (every car, free upgrades of its own); on again: all kept
  await act('to-title'); await page.waitForTimeout(150); await act('to-career'); await page.waitForTimeout(150); await act('career-toggle'); await page.waitForTimeout(150);
  await act('to-title'); await page.waitForTimeout(150);
  const b6 = await txt('btn-career');
  await act('to-car'); await page.waitForTimeout(200);
  await page.evaluate(async () => { const g = window.__game; while (Core.MODELS[g.S.car].id !== 'kaze') { g.onAction('car-next'); await new Promise(r => setTimeout(r, 30)); } });
  const k6 = await car();
  await page.evaluate(async () => { const g = window.__game; while (Core.MODELS[g.S.car].id !== 'pico') { g.onAction('car-next'); await new Promise(r => setTimeout(r, 30)); } g.onAction('to-upg'); await new Promise(r => setTimeout(r, 150)); });
  const u6 = await page.evaluate(() => [...document.querySelectorAll('[data-upg="motor"] button')].map(b => b.textContent + (b.classList.contains('sel') ? '*' : '')).join(','));
  T.check('career off: every car raced freely (no price), the free game\'s own upgrades (stock)', b6 === 'Kariera' && k6.act === 'to-track' && k6.cls.includes('off') && /Serijski\*/.test(u6) && !/€/.test(u6), JSON.stringify({ b6, k6, u6 }));
  await act('upg-done'); await act('to-title'); await page.waitForTimeout(150); await act('to-career'); await page.waitForTimeout(150); await act('career-toggle'); await page.waitForTimeout(150);
  const c7 = await cr();
  T.check('career on again: the money, the garage and the upgrades kept', c7.on && c7.money === 5000 && c7.cars.join() === 'pico,kaze' && c7.upg.pico.motor === 1, JSON.stringify(c7));

  T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
