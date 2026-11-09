// The test money in the address (js/denar.js; the user's wish of 9. 11. 2026, a tester's aid hidden in the Google Play build): index.html
// ?denar with no career: a new one as the game makes it (on, the PICO TURBO) with 50.000.000, the game's career has it at once (Kariera ·
// 50.000.000), the money before (none) kept in rra-denar-prej, the parameter gone from the address, a toast. garaza.html?denar=50000000
// &car=cisterna on a career of 92.000: 50.000.000 in the garage and the career, 92.000 kept, the address ?car=cisterna (that vehicle on
// the table); again with ?denar=abc: nothing changed, a red toast, the address ?car=cisterna. The garage on the mockup's Veteran and the
// career off: ?denar=1.234.567 opens it on Kariera with 1.234.567, the career still off, 92.000 still kept (once). The amounts: empty
// 50.000.000, dots in threes, at most 999.999.999, at least 0.
//   node tests/browser/denar.test.mjs
import { serve, launch, checker } from './lib.mjs';

const T = checker('denar');
const srv = await serve();
const browser = await launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const store = () => page.evaluate(() => ({ career: JSON.parse(localStorage.getItem('tdgp-career') || 'null'), prej: JSON.parse(localStorage.getItem('rra-denar-prej') || 'null'),
    search: location.search, toast: Denar.note ? Denar.note.txt : '', bad: !!(Denar.note && Denar.note.bad), shown: (document.getElementById('denar-toast') || {}).textContent || '' }));
  const garage = async (q) => {
    await page.goto(srv.base + '/garaza.html' + q);
    await page.waitForFunction(() => window.__garage && Garage3D.ready, null, { timeout: 180000 });
    await page.evaluate(() => { __garage.hold = true; if (document.getElementById('g-guide').classList.contains('on')) __garage.guide(99); });
    return page.evaluate(() => ({ mode: __garage.S.mode, money: __garage.S.money, car: __garage.S.car, coins: document.getElementById('g-money').textContent }));
  };

  // 1. the game, no career yet: ?denar (no amount): a new career with 50.000.000, seen by the game at once
  await page.goto(srv.base + '/manifest.webmanifest');
  await page.evaluate(() => localStorage.clear());
  await page.goto(srv.base + '/index.html?denar');
  await page.waitForFunction(() => window.__game && __game.screen === 'title', null, { timeout: 180000 });
  const g = await page.evaluate(() => ({ money: __game.career && __game.career.money, on: __game.career && __game.career.on, btn: document.getElementById('btn-career').textContent.replace(/\s+/g, ' ') }));
  const a = await store();
  T.check('index.html?denar with no career: a new one as the game makes it (on, the PICO TURBO, stock) with 50.000.000, the game has it at once (Kariera · 50.000.000)',
    a.career && a.career.v === 1 && a.career.on === true && a.career.money === 50000000 && a.career.cars.join() === 'pico' && JSON.stringify(a.career.upg) === '{"pico":{"motor":0,"gume":0,"zavore":0,"aero":0}}'
    && a.career.races === 0 && g.money === 50000000 && g.on === true && /50\.000\.000/.test(g.btn), JSON.stringify({ g, career: a.career }));
  T.check('the game: no money before (rra-denar-prej money null), the parameter gone from the address, the toast says it', a.prej && a.prej.money === null && a.search === '' && /50\.000\.000/.test(a.toast) && /nova kariera/.test(a.toast) && a.shown === a.toast && !a.bad, JSON.stringify(a));

  // 2. the garage on a career of 92.000: ?denar=50000000&car=cisterna
  await page.evaluate(() => { const c = JSON.parse(localStorage.getItem('tdgp-career')); c.money = 92000; c.races = 3; localStorage.setItem('tdgp-career', JSON.stringify(c)); localStorage.removeItem('rra-denar-prej'); });
  const b = await garage('?denar=50000000&car=cisterna'), b2 = await store();
  T.check('garaza.html?denar=50000000&car=cisterna: 50.000.000 in the garage (Kariera) and in the career, its races as they were, the TITAN CISTERNA on the table',
    b.mode === 'game' && b.money === 50000000 && b.coins === '50.000.000' && b.car === 'cisterna' && b2.career.money === 50000000 && b2.career.races === 3 && b2.career.on === true, JSON.stringify({ b, career: b2.career }));
  T.check('the garage: 92.000 kept in rra-denar-prej, the address ?car=cisterna (denar gone, the rest as it was), the toast (prej 92.000)',
    b2.prej && b2.prej.money === 92000 && b2.search === '?car=cisterna' && /50\.000\.000/.test(b2.toast) && /prej 92\.000/.test(b2.toast), JSON.stringify(b2));

  // 3. ?denar=abc: nothing changed, a red toast, the parameter gone
  const c = await garage('?denar=abc&car=cisterna'), c2 = await store();
  T.check('?denar=abc: the money as it was (50.000.000), 92.000 still kept, a red toast, the address ?car=cisterna',
    c.money === 50000000 && c2.career.money === 50000000 && c2.prej.money === 92000 && c2.search === '?car=cisterna' && /neveljaven/.test(c2.toast) && c2.bad, JSON.stringify({ c, c2 }));

  // 4. the garage on the mockup's Veteran, the career off: ?denar=1.234.567 opens it on Kariera
  await page.evaluate(() => document.querySelector('#g-modes [data-mode="vet"]').click());
  await page.evaluate(async () => { let t = 0; do { __garage.advance(0.5); t += 0.5; await new Promise(r => setTimeout(r, 0)); } while (Garage3D.busy && t < 200); });
  const v = await page.evaluate(() => ({ mode: __garage.S.mode, saved: JSON.parse(localStorage.getItem('apex-garage')).mode }));
  await page.evaluate(() => { const c = JSON.parse(localStorage.getItem('tdgp-career')); c.on = false; localStorage.setItem('tdgp-career', JSON.stringify(c)); });
  const d = await garage('?denar=1.234.567'), d2 = await store();
  T.check('the garage on the Veteran (saved so) and the career off: ?denar=1.234.567 opens it on Kariera with 1.234.567, the career still off, 92.000 still kept (once), the address bare',
    v.mode === 'vet' && v.saved === 'vet' && d.mode === 'game' && d.money === 1234567 && d.coins === '1.234.567' && d2.career.money === 1234567 && d2.career.on === false && d2.prej.money === 92000 && d2.search === '',
    JSON.stringify({ v, d, d2 }));

  // 5. the amounts
  const am = await page.evaluate(() => ['', '50000000', '50.000.000', '5 000 000', '5000000000', '-5', '1e6', '12.5', 'abc'].map(s => Denar.amount(s)));
  T.check('the amounts: empty 50.000.000, digits, dots in threes, spaces, at most 999.999.999, at least 0; not a number NaN',
    JSON.stringify(am) === JSON.stringify([50000000, 50000000, 50000000, 5000000, 999999999, 0, 1000000, 12, null]), JSON.stringify(am));
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
  await ctx.close();
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close(); await srv.close();
}
T.done();
