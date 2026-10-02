// The new look, round two (Posodobi grafiko, drugi krog): the asphalt, the sky, the contact shading, the grass, the rain, the sun, the speed.
// 1. Jezero by day (quality 'high', the chase camera): the asphalt catches the sun, the lawn's loud green toned down, soft contact shading
//    at the foot of the walls and the stands, worn grass past the kerbs where the cars run wide.
// 2. The cockpit: the sky drawn with its clouds; at night the moon; in the rain an overcast sky, the wipers on the windscreen and the
//    puddles' water on the road.
// 3. The Gorski reli in the evening: the sun's rays between the trees.
// 4. At speed: the picture stays sharp (no streaks, no depth of field); the summer's heat over the asphalt seen from the cockpit.
// 5. Quality 'normal': none of the costly ones (no clouds, no rays, no streaks), the precomputed ones stay (the contact shading).
//   node tests/browser/look2.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('the new look, round two: asphalt, sky, contact shading, grass, rain, sun, speed');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase', weather: 'dry', track: 'jezero' }, { width: 390, height: 844 });
  const act = (a) => page.evaluate((a) => window.__game.onAction(a), a);
  const pick = (set, v) => page.evaluate(([set, v]) => document.querySelector(`[data-set="${set}"] button[data-v="${v}"]`).click(), [set, v]);
  const frames = (n) => page.evaluate((n) => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
  const look = () => page.evaluate(() => Render.look2Info());
  // drawn frames of a paused race with a camera of our choosing (the render-side effects step on, nothing simulated moves), the look
  // read straight after them (the game's own next frame draws with its own camera)
  const draw = (n, mode) => page.evaluate(([n, mode]) => { const g = window.__game; g.pause(); for (let i = 0; i < n; i++) Render.frame(1 / 60, 1, g.race.player, mode, {}); return Render.look2Info(); }, [n, mode]);

  // 1. Jezero by day
  await startTrack(page, 'jezero'); await frames(4);
  const j = await look();
  T.check('Jezero: the asphalt catches the sun, the lawn toned down, contact shading at the walls\' feet, worn grass past the kerbs', j.sheen > 0.02 && j.asphalt > 0 && j.natGrass > 0 && j.ao > 1000 && j.worn > 8, JSON.stringify(j));

  // 2. the cockpit: the clouds by day, the moon at night
  const c1 = await draw(3, 'cockpit');
  T.check('the cockpit by day: the sky with its clouds, no moon, no overcast', c1.skyOn && c1.clouds === 1 && c1.moon === 0 && c1.overcast === 0, JSON.stringify(c1));
  await page.evaluate(() => Render.setAtmos({ season: 'summer', tod: 'night' }));
  const c2 = await draw(3, 'cockpit');
  T.check('the cockpit at night: the moon over the clouds', c2.skyOn && c2.moon > 0.9 && c2.clouds === 1, JSON.stringify(c2));
  await page.evaluate(() => Render.setAtmos({ season: 'summer', tod: 'day' }));

  // ... and in the rain: an overcast sky, the wipers, the puddles
  await act('to-track'); await page.waitForTimeout(200); await pick('tod', 'day'); await pick('weather', 'rain');
  await startTrack(page, 'jezero'); await frames(6);
  const r1 = await draw(4, 'cockpit');
  T.check('the cockpit in the rain: an overcast sky, the wipers sweeping the drops off the windscreen', r1.overcast > 0.5 && r1.wipers, JSON.stringify(r1));
  const r2 = await draw(4, 'chase');
  T.check('the rain on the road: the puddles\' water', r2.puddleK > 0.3 && !r2.wipers, JSON.stringify(r2));

  // 3. the Gorski reli in the evening: the sun's rays between the trees
  await act('to-track'); await page.waitForTimeout(200); await pick('weather', 'dry'); await pick('tod', 'dusk');
  await startTrack(page, 'gora'); await frames(6);
  const g1 = await look();
  T.check('the Gorski reli in the evening: the sun\'s rays between the trees', g1.rays, JSON.stringify(g1));

  // 4. at speed: nothing blurred; the summer's heat from the cockpit
  await act('to-track'); await page.waitForTimeout(200); await pick('tod', 'day');
  await startTrack(page, 'spa');
  await page.evaluate(() => { const g = window.__game, P = g.race.player; g.pause(); for (let i = 0; i < 600 && P.speed < 50; i++) g.sim(0.1, true); });
  const s1 = await draw(3, 'chase');
  T.check('at speed: the picture stays sharp (no streaks towards its edges, no depth of field: nothing blurred)', s1.speedBlur === 0 && s1.blur === 0, JSON.stringify(s1));
  const s2 = await draw(3, 'cockpit');
  T.check('the summer\'s heat over the far asphalt, from the cockpit (and no streaks there: the car\'s inside goes with the driver)', s2.heat === 1 && s2.speedBlur === 0, JSON.stringify(s2));

  // 5. quality 'normal': none of the costly ones; the precomputed ones stay
  await act('to-track'); await page.waitForTimeout(200); await pick('quality', 'normal');
  await startTrack(page, 'jezero'); await frames(4);
  const n1 = await draw(3, 'cockpit');
  T.check('quality normal: no clouds, no rays, no streaks, no heat; the contact shading and the asphalt\'s sheen stay', n1.clouds === 0 && !n1.rays && n1.speedBlur === 0 && n1.heat === 0 && n1.ao > 1000 && n1.sheen > 0.02, JSON.stringify(n1));

  T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
