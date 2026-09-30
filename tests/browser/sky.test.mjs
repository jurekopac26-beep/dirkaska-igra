// The sky's show: at night the stars and the moon over the horizon (the cockpit), the windows of the buildings lit (Riviera's facades, the
// built houses' glass) and dark by day; the morning (Jutro) with its mist in the valleys (Spa: layers over the low land) and none on a flat
// world; a rainbow after the rain by day (none at night); a thunderstorm (Nevihta): rain, lightning (a flash, the thunder after it) and at
// night the lamps' streaks on the wet road; an endurance race's time of day moved on smoothly (the light between day and night, the
// floodlights coming on); the Eau Rouge brook's flowing water. No shader errors anywhere.
//   node tests/browser/sky.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('sky');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', track: 'riviera', tod: 'night' }, { width: 844, height: 390 });
  const frames = (n) => page.evaluate((n) => new Promise(res => { let k = 0; const f = () => (++k >= n ? res() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
  const show = () => page.evaluate(() => Render.show);

  // 1. night at Riviera: the windows lit; the cockpit sees the stars and the moon
  await startTrack(page, 'riviera');
  await page.evaluate(() => { window.__game.sim(4, true); window.__game.S.camera = 'cockpit'; }); await frames(6);
  const n1 = await show();
  await page.evaluate(() => { window.__game.S.camera = 'chase'; }); await frames(3);
  T.check('night: the windows of the buildings lit (facade materials patched), the stars and the moon over the horizon from the cockpit', n1.todK === 1 && n1.win > 0.99 && n1.winMats > 0 && n1.sky && n1.stars && n1.moon, JSON.stringify(n1));
  await page.evaluate(() => Render.setAtmos({ season: 'summer', tod: 'day' })); await frames(3);
  const d1 = await show();
  T.check('by day: the windows dark, no stars, no moon', d1.todK === 0 && d1.win === 0 && !d1.stars && !d1.moon, JSON.stringify(d1));

  // 2. an endurance race's clock: the light between day and night, the floodlights at late dusk
  const e = await page.evaluate(async () => { const out = []; for (const k of [0.25, 0.5, 0.7, 0.9, 1]) { Render.setTodK(k); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const f = Render.scene.fog.color; out.push({ k, sh: Render.show.todK, lum: +(0.3 * f.r + 0.59 * f.g + 0.11 * f.b).toFixed(3), flood: Render.show.flood }); } return out; });
  T.check('the time of day moved on: the sky darker step by step (day, dusk, night), the floodlights on from late dusk', e.every((x, i) => i === 0 || x.lum <= e[i - 1].lum + 1e-3) && e[0].lum > e[4].lum * 3 && !e[0].flood && e[3].flood && e[4].flood && e[4].sh === 1, JSON.stringify(e));
  await page.evaluate(() => Render.setAtmos({ season: 'summer', tod: 'day' }));

  // 3. a rainbow after the rain by day; none at night
  await page.evaluate(() => Render.rainbow(true));
  // (it fades in over a few seconds of frames: a slow software renderer draws few of them)
  const b1 = await page.waitForFunction(() => Render.show.bow > 0.4 && Render.show.bow, null, { timeout: 30000 }).then(h => h.jsonValue()).catch(() => page.evaluate(() => Render.show.bow));
  await page.evaluate(() => { Render.rainbow(false); Render.setAtmos({ season: 'summer', tod: 'night' }); Render.rainbow(true); }); await page.waitForTimeout(1500);
  const b2 = (await show()).bow;
  T.check('a rainbow after the rain fades in by day; none at night', b1 > 0.4 && b2 === 0, JSON.stringify({ b1, b2 }));
  await page.evaluate(() => { Render.rainbow(false); window.__game.onAction('to-title'); });

  // 4. a thunderstorm at night: rain, lightning with its flash and the thunder after it, the lamps' streaks on the wet road
  await page.evaluate(() => { window.__thunder = []; Render.onThunder = (d, v) => window.__thunder.push([+d.toFixed(2), +v.toFixed(2)]);
    document.querySelector('[data-set="weather"] button[data-v="storm"]').click(); });
  await startTrack(page, 'riviera');
  const st = await page.evaluate(async () => { const g = window.__game; g.sim(3, true); let flash = 0, streaks = 0, bolt = false;
    for (let k = 0; k < 900 && window.__thunder.length < 2; k++) { await new Promise(r => requestAnimationFrame(r)); const s = Render.show; flash = Math.max(flash, s.flashMax); streaks = Math.max(streaks, s.streaks); bolt = bolt || s.bolt; }
    return { rain: g.race.rain, storm: g.race.storm, show: Render.show, flash, streaks, bolt, thunder: window.__thunder }; });
  T.check('a thunderstorm: rain all the race, lightning (a flash over the world) and the thunder after it, later the farther it struck', st.rain === 1 && st.storm && st.show.storm && st.show.strikes >= 1 && st.flash > 0.3 && st.thunder.length >= 1 && st.thunder.every(([d, v]) => d > 0.5 && d < 7 && v > 0 && v <= 1),
    JSON.stringify({ strikes: st.show.strikes, flash: st.flash, bolt: st.bolt, thunder: st.thunder }));
  T.check('at night on the wet road: the streaks of the head and tail lights (and the floodlights) on the water', st.streaks >= 8, JSON.stringify({ streaks: st.streaks }));
  await page.evaluate(() => { window.__game.onAction('to-title'); document.querySelector('[data-set="weather"] button[data-v="dry"]').click(); });
  const s0 = await show();
  T.check('the storm over with the dry weather: no more lightning', !s0.storm, JSON.stringify(s0));

  // 5. the morning: mist over Spa's valleys (Eau Rouge), none on flat Riviera; the brook's water flows
  await page.evaluate(() => document.querySelector('[data-set="tod"] button[data-v="dawn"]').click());
  await frames(3);
  const m0 = await show();
  await startTrack(page, 'spa'); await frames(4);
  const m1 = await show(), br = await page.evaluate(() => { const b = Render.world.dyn.brook; return b ? b.uT.value : null; });
  const br2 = await page.waitForFunction((v) => Render.world.dyn.brook.uT.value !== v && Render.world.dyn.brook.uT.value, br, { timeout: 30000 }).then(h => h.jsonValue()).catch(() => page.evaluate(() => Render.world.dyn.brook.uT.value));   // (the next frames)
  T.check('the morning: the mist in Spa\'s valleys (layers over the low land), none on flat Riviera', m0.dawn && m0.mist === 0 && m1.dawn && m1.mist >= 2 && m1.mistTop > 0, JSON.stringify({ m0, m1 }));
  T.check('the Eau Rouge brook: its water flows (its own clock on)', br != null && br2 > br, JSON.stringify({ br, br2 }));

  T.check('no page errors (no shader errors)', errors.length === 0, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
