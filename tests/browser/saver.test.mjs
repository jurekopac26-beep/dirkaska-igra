// The battery saver and faster loading: with Varčevanje z baterijo on, the game draws at most 30 frames a second (fewer than the browser
// offers) at 0.7 of the resolution; 'Samodejno' (auto) turns it on only while the battery is low (not charging, 20 % or less), with a
// message; off again: every frame, the full resolution. A settings switch that does not change the picture (sound, language) does not
// build the shaders again. A track loads without the title demo (made only when a menu shows it: after the race, on the title, it runs on
// the new track), its shaders compiled while the loading screen is up.
//   node tests/browser/saver.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('saver');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', track: 'jezero', saver: 'off' }, { width: 390, height: 844 });
  const click = (set, v) => page.evaluate(([set, v]) => document.querySelector(`[data-set="${set}"] button[data-v="${v}"]`).click(), [set, v]);
  // frames over 2 s: offered by the browser and drawn, per second; the pixel ratio
  const rate = () => page.evaluate(async () => { const g = window.__game, a = g.fr, t0 = performance.now(); await new Promise(r => setTimeout(r, 2000)); const b = g.fr, s = (performance.now() - t0) / 1000;
    return { raf: +((b.raf - a.raf) / s).toFixed(1), drawn: +((b.drawn - a.drawn) / s).toFixed(1), pr: Render.pixelRatio, saver: g.saver }; });

  // 1. off: every frame drawn at the full resolution
  await page.evaluate(() => window.__game.onAction('to-settings')); await page.waitForTimeout(300);
  const r0 = await rate();
  T.check('saver off: every frame the browser offers is drawn, full resolution', !r0.saver && r0.drawn >= r0.raf - 1 && r0.pr === 1, JSON.stringify(r0));
  // 2. on: at most 30 a second (fewer than offered when the browser offers over 40), 0.7 of the resolution
  await click('saver', 'on'); await page.waitForTimeout(300);
  const r1 = await rate();
  T.check('saver on: at most 30 frames a second drawn (fewer than offered), 0.7 of the resolution', r1.saver && r1.drawn <= 31 && (r1.raf < 40 || r1.drawn <= r1.raf * 0.75) && Math.abs(r1.pr - 0.7) < 0.01, JSON.stringify(r1));
  // 3. auto: on only while the battery is low (a message), off when it charges
  await click('saver', 'auto'); await page.waitForTimeout(200);
  const a0 = await page.evaluate(() => ({ saver: window.__game.saver, pr: Render.pixelRatio }));
  await page.evaluate(() => { window.__game.batLow = true; }); await page.waitForTimeout(200);
  const a1 = await page.evaluate(() => ({ saver: window.__game.saver, pr: Render.pixelRatio }));
  const r2 = await rate();
  await page.evaluate(() => { window.__game.batLow = false; }); await page.waitForTimeout(200);
  const a2 = await page.evaluate(() => ({ saver: window.__game.saver, pr: Render.pixelRatio, stored: JSON.parse(localStorage.getItem('tdgp-settings')).saver }));
  T.check('auto: off with a good battery, on while it is low (30 a second, 0.7), off again; kept as "auto"', !a0.saver && a0.pr === 1 && a1.saver && Math.abs(a1.pr - 0.7) < 0.01 && r2.drawn <= 31 && !a2.saver && a2.pr === 1 && a2.stored === 'auto', JSON.stringify({ a0, a1, r2, a2 }));
  await click('saver', 'off'); await page.waitForTimeout(200);

  // 4. a switch that does not change the picture does not build the shaders again; shadows do
  await page.evaluate(() => { window.__rs = 0; const f = Render.applySettings; Render.applySettings = (s) => { window.__rs++; return f(s); }; });
  await click('sound', '1'); await click('sound', '0'); await click('lang', 'en'); await click('lang', 'sl'); await click('vibrate', '0');
  const n0 = await page.evaluate(() => window.__rs);
  await click('shadows', '1'); await page.waitForTimeout(200);
  const n1 = await page.evaluate(() => window.__rs);
  T.check('sound, language, vibration: the shaders are not built again; shadows on: they are', n0 === 0 && n1 === 1, JSON.stringify({ n0, n1 }));
  await click('shadows', '0');
  await page.evaluate(() => window.__game.onAction('settings-done')); await page.waitForTimeout(200);

  // 5. loading: no title demo made for a race started from the menus; after it, the title demo runs on the new track
  await startTrack(page, 'riviera');
  const l1 = await page.evaluate(() => ({ demo: window.__game.demo, ms: window.__game.loadMs, track: window.__game.race.track.def.id }));
  await page.evaluate(() => window.__game.onAction('to-title')); await page.waitForTimeout(800);
  const l2 = await page.evaluate(() => { const d = window.__game.demo; return { track: d && d.track.def.id, cars: d && d.cars.length, t: d && d.time, moving: d && d.cars.some(c => c.speed > 5) }; });
  T.check('a track loads without the title demo (the race on it at once); on the title after it the demo races on the new track', l1.demo === null && l1.ms > 0 && l1.track === 'riviera' && l2.track === 'riviera' && l2.cars === 10 && l2.t > 4 && l2.moving, JSON.stringify({ l1, l2 }));

  T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
