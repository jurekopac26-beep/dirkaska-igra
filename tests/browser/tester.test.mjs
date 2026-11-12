// Test s prijatelji (js/tester.js; docs/test-s-prijatelji.md; the user's wish of 12. 11. 2026): the game sends nothing without ?tester=<code>,
// nothing in a test's browser (navigator.webdriver) even with a code, unless the test says so (window.__testerTest). With it: ?tester=t1 asks
// once (the notice), Ne keeps it off and is remembered (no asking again), a new code asks again, Strinjam se sends a visit's start (code T1, the
// device, the stamp), a race started and left for the title sends the race (track, mode, weather, seconds, zapustil), one driven to the line
// sends cilj and the place; a reload with no code
// counts on (the consent kept); ?tester=off forgets it. The counter's address answered here (page.route): nothing leaves the machine.
//   node tests/browser/tester.test.mjs
import { serve, launch, openGame, startTrack, driveToResults, checker } from './lib.mjs';

const T = checker('tester');
const srv = await serve();
const browser = await launch();
const HOST = 'https://stevec.rra-test.workers.dev/';
try {
  // 1. no code, and a code in a test's browser without __testerTest: nothing sent, off, no notice
  for (const q of ['', '?tester=T1']) {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html' + q);
    let n = 0; await ctx.route(HOST + '**', (r) => { n++; r.fulfill({ status: 204 }); });
    await page.waitForFunction(() => window.__game.screen === 'title', null, { timeout: 180000 });
    await startTrack(page, 'jezero'); await page.evaluate(() => window.__game.onAction('to-title')); await page.waitForTimeout(300);
    const s = await page.evaluate(() => ({ on: Tester.on, sent: Tester.state().sent.length, ask: !!document.getElementById('tester-ok'), st: localStorage.getItem('rra-tester') }));
    T.check('index.html' + (q || ' (no code)') + ' in a test\'s browser: off, nothing sent, no notice, nothing kept', !s.on && !s.sent && !n && !s.ask && s.st === null, JSON.stringify({ s, n }));
    T.check('no errors' + (q ? ' (' + q + ')' : ''), errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  // 2. the tester's own: __testerTest set before the game's scripts
  const got = [];
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { length: 'short' }, undefined, { init: () => { window.__testerTest = 1; } });
  await ctx.route(HOST + '**', (r) => { const b = r.request().postData(); try { got.push(JSON.parse(b)); } catch (_) { got.push({ bad: b }); } r.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*' } }); });
  await page.evaluate(() => localStorage.removeItem('rra-tester'));
  const open = async (q) => { await page.goto(srv.base + '/index.html' + q, { timeout: 180000 }); await page.waitForFunction(() => window.__game && window.__game.screen === 'title', null, { timeout: 180000 }); await page.waitForTimeout(200); };
  const st = () => page.evaluate(() => ({ on: Tester.on, ask: !!document.getElementById('tester-ok'), kept: JSON.parse(localStorage.getItem('rra-tester') || 'null'), s: Tester.state() }));

  await open('?tester=t1');
  let a = await st();
  T.check('?tester=t1: the notice (code T1), still off, nothing sent', a.ask && !a.on && got.length === 0
    && /T1/.test(await page.textContent('#tester-ok')) && /Brez imen, brez IP in brez piškotkov/.test(await page.textContent('#tester-ok')), JSON.stringify(a));
  await page.click('#tester-ne'); await page.waitForTimeout(150);
  a = await st();
  T.check('Ne: the notice gone, off, nothing sent, the no remembered', !a.ask && !a.on && got.length === 0 && a.kept && a.kept.koda === 'T1' && a.kept.ok === false, JSON.stringify(a));
  await open('?tester=T1');
  a = await st();
  T.check('?tester=T1 again after Ne: no asking again, off, nothing sent', !a.ask && !a.on && got.length === 0, JSON.stringify(a));

  await open('?tester=T2');
  a = await st();
  T.check('a new code (T2): asks again', a.ask && !a.on, JSON.stringify(a));
  await page.click('#tester-da'); await page.waitForTimeout(300);
  a = await st();
  const s0 = got.find((e) => e.t === 'start');
  T.check('Strinjam se: on, the visit\'s start sent (code T2, a visit id, the device: namizje, Linux, Chrome; the stamp)', a.on && !a.ask && a.kept.ok === true && s0
    && s0.k === 'T2' && /^[\w-]{8,40}$/.test(s0.s) && s0.naprava === 'namizje' && s0.os && s0.brskalnik && s0.zig === 'lokalno' && s0.s === a.s.seja, JSON.stringify({ a, got }));

  await startTrack(page, 'jezero');
  a = await st();
  T.check('a race started: open on the track, the mode and the weather (nothing sent yet)', a.s.dirka && a.s.dirka.proga === 'jezero' && a.s.dirka.nacin && a.s.dirka.vreme && !got.some((e) => e.t === 'dirka'), JSON.stringify(a.s));
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.__game.onAction('to-title')); await page.waitForTimeout(300);
  const d = got.find((e) => e.t === 'dirka');
  T.check('left for the title: the race sent (jezero, its mode and weather, seconds, zapustil, the car, the place at leaving or none, the seconds on the track), none open', d && d.k === 'T2' && d.s === s0.s && d.proga === 'jezero' && d.nacin === a.s.dirka.nacin
    && d.vreme === a.s.dirka.vreme && d.trajanje > 0.5 && d.izid === 'zapustil' && (d.mesto === null || (Number.isInteger(d.mesto) && d.mesto >= 1))
    && typeof d.avto === 'string' && d.avto.length > 0 && d.avto === a.s.dirka.avto && d.cp >= 1 && d.cm >= 0 && d.cg === 0 && !(await st()).s.dirka, JSON.stringify(d));
  await startTrack(page, 'jezero'); await driveToResults(page);
  const c = got.filter((e) => e.t === 'dirka')[1];
  T.check('a race driven to the line: sent at the results (jezero, cilj, the place 1..n, the car)', c && c.proga === 'jezero' && c.izid === 'cilj' && Number.isInteger(c.mesto) && c.mesto >= 1 && c.trajanje > 0 && c.avto, JSON.stringify(c));
  T.check('only the known fields sent (no names, no address, no time of the device)', got.every((e) => Object.keys(e).every((k) => ['k', 's', 't', 'zig', 'naprava', 'os', 'brskalnik', 'proga', 'nacin', 'vreme', 'trajanje', 'izid', 'mesto', 'avto', 'cp', 'cm', 'cg'].includes(k))), JSON.stringify(got));

  got.length = 0;
  await open('');
  a = await st();
  T.check('a reload with no code: counts on with the kept code (a new visit: start, T2), no notice', a.on && !a.ask && got.some((e) => e.t === 'start' && e.k === 'T2'), JSON.stringify({ a, got }));
  got.length = 0;
  await page.goto(srv.base + '/garaza.html', { timeout: 180000 }); await page.waitForTimeout(800);
  a = await page.evaluate(() => ({ on: Tester.on, s: Tester.state() }));
  T.check('the garage (garaza.html): counts too, the time in the garage', a.on && a.s.kje === 'garaza' && got.some((e) => e.t === 'start' && e.k === 'T2' && e.zig === 'garaza'), JSON.stringify({ a, got }));
  got.length = 0;
  await open('?tester=off');
  a = await st();
  T.check('?tester=off: forgotten, off, nothing sent', !a.on && a.kept === null && !a.ask, JSON.stringify(a));
  await open('');
  a = await st();
  T.check('then with no code: off, nothing sent', !a.on && !a.ask && got.filter((e) => e.t !== 'end').length === 0, JSON.stringify({ a, got }));
  T.check('no errors (the tester\'s own)', errors.length === 0, errors.join(' | '));
  await ctx.close();
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close(); await srv.close();
}
T.done();
