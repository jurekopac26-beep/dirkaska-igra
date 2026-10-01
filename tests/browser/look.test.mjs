// The new look (Posodobi grafiko): the night's lights, the rain on the road, the crowd and the cars' sparks.
// 1. Monaco at night (quality 'high'): the facades' windows lit, glows round the floodlights' lamps, the lights' glow (bloom) in the post
//    pass; by day none of it but a weak glow round the brightest (and no stars).
// 2. Suzuka in the rain: the lights' reflections on the wet road, the drops' splashes, puddles on the circuit's tarmac; dry: none.
// 3. Jezero: the crowd excited when the lights go out (the stands and the spectators: uHype), calm again a few seconds later.
// 4. A formula at speed: sparks from its plank.
//   node tests/browser/look.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('the new look: night, rain, crowd, sparks');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase', weather: 'dry', track: 'monaco' }, { width: 844, height: 390 });
  const act = (a) => page.evaluate((a) => window.__game.onAction(a), a);
  const pick = (set, v) => page.evaluate(([set, v]) => document.querySelector(`[data-set="${set}"] button[data-v="${v}"]`).click(), [set, v]);
  const frames = (n) => page.evaluate((n) => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
  const look = () => page.evaluate(() => Render.lookInfo());
  // drawn frames of a paused race (dt each: the render-side effects step on, nothing simulated moves)
  const draw = (n, dt) => page.evaluate(([n, dt]) => { const g = window.__game; for (let i = 0; i < n; i++) Render.frame(dt, 1, g.race.player, g.S.camera, {}); }, [n, dt]);

  // 1. night and day on Monaco
  await act('to-track'); await page.waitForTimeout(200); await pick('tod', 'night');
  await startTrack(page, 'monaco'); await frames(4);
  const n1 = await look();
  T.check('Monaco at night: lit windows, glows round the floodlights, the lights\' glow in the post pass', n1.tod === 'night' && n1.windows > 0 && n1.winK === 1 && n1.halos > 50 && n1.bloomOn, JSON.stringify(n1));
  await page.evaluate(() => Render.setAtmos({ season: 'summer', tod: 'day' })); await frames(3);
  const d1 = await look();
  T.check('by day: no lit windows, no floodlights, no stars, only a weak glow', d1.tod === 'day' && d1.winK === 0 && d1.bloom < n1.bloom * 0.6 && d1.halos === 0 && d1.stars === 0, JSON.stringify(d1));

  // 2. rain on Suzuka, then a dry race
  await act('to-track'); await page.waitForTimeout(200); await pick('tod', 'day'); await pick('weather', 'rain');
  await startTrack(page, 'suzuka'); await frames(6);
  const w1 = await page.evaluate(() => Render.wetFx());
  T.check('Suzuka in the rain: the lights mirrored on the wet road, the drops splashing, puddles on the tarmac', w1.water > 0.5 && w1.streaks > 20 && w1.splashes > 10 && w1.puddles > 0.2, JSON.stringify(w1));
  await act('to-track'); await page.waitForTimeout(200); await pick('weather', 'dry');
  await startTrack(page, 'suzuka'); await frames(6);
  const w2 = await page.evaluate(() => Render.wetFx());
  T.check('a dry road: no reflections, no splashes, no puddles', w2.streaks === 0 && w2.splashes === 0 && w2.puddles === 0, JSON.stringify(w2));

  // 3. the crowd on Jezero: the lights go out
  await startTrack(page, 'jezero');
  await page.evaluate(() => { const g = window.__game; g.pause(); for (let i = 0; i < 400 && g.race.state !== 'racing'; i++) g.sim(0.05, true); });
  await draw(2, 1 / 60);
  const h1 = await look();
  await draw(60, 0.1);
  const h2 = await look();
  T.check('the crowd: excited as the lights go out, calm again a few seconds later', h1.hype > 0.8 && h2.hype < 0.2, JSON.stringify({ start: h1.hype, later: h2.hype }));

  // 4. a formula at speed on Spa: sparks from its plank
  await act('to-car'); await page.waitForTimeout(200);
  await page.evaluate(() => { const g = window.__game, i = Core.MODELS.findIndex(m => m.body === 'formula'); for (let k = 0; k < Core.MODELS.length && Core.MODELS[g.S.car].body !== 'formula'; k++) g.onAction('car-next'); return i; });
  await startTrack(page, 'spa');
  const sp = await page.evaluate(() => {
    const g = window.__game, P = g.race.player; g.pause();
    for (let i = 0; i < 600 && P.speed < 60; i++) g.sim(0.1, true);
    let n = 0; for (let i = 0; i < 30; i++) { g.sim(1 / 60, true); Render.frame(1 / 60, 1, P, g.S.camera, {}); n = Math.max(n, Render.fxStats().sparks); }
    return { car: P.m.body, speed: +P.speed.toFixed(1), sparks: n };
  });
  T.check('a formula at speed: sparks from its plank', sp.car === 'formula' && sp.speed > 45 && sp.sparks > 3, JSON.stringify(sp));

  T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
