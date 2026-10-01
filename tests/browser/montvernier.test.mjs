// Lacets de Montvernier, round 2 (Posodobi progo): the Tour's mountain prize over the road and its balloon, the belvédère, the fans' art in the
// meadows, chevron boards round every lacet, rockfall nets, street lamps and reflectors, the fans' picnics (grill smoke), the far mountains round
// the horizon, the TV helicopter with the car, the crowds' cheer for the sound; the flyover before the start (with its captions, skipped by a key),
// the fans who run beside the car, the lamps and the reflectors lit at night.
//   node tests/browser/montvernier.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('Lacets de Montvernier: round 2');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase', weather: 'dry', tod: 'day', track: 'montvernier' }, { width: 640, height: 360 });
  await page.addStyleTag({ content: '#s-pause { display: none !important; }' });
  await startTrack(page, 'montvernier');

  // 1. the flyover before the race: on at a fresh start, its first caption the village of the start; a key skips it
  const f0 = await page.evaluate(() => ({ fly: window.__game.pkFly, cap: Render.pkFly.caps.map(c => c.n) }));
  await page.evaluate(async () => { const g = window.__game; while (g.pkFly && g.pkFly.t < 0.6) await new Promise(r => requestAnimationFrame(r)); });
  const f1 = await page.evaluate(() => ({ fly: window.__game.pkFly, txt: document.querySelector('#pk-fly b').textContent }));
  await page.keyboard.press('Space'); await page.waitForTimeout(150);
  const f2 = await page.evaluate(() => window.__game.pkFly);
  T.check('the flyover before the race: on at a fresh start, captioned (Pontamafrey first, Montvernier last), skipped by a key',
    !!f0.fly && f0.cap[0] === 'Pontamafrey' && f0.cap[f0.cap.length - 1] === 'Montvernier' && f1.txt === 'Pontamafrey' && f2 === null, JSON.stringify({ f0, f1, f2 }));

  // 2. the world's new things
  const w = await page.evaluate(() => {
    const W = Render.world, names = {}; W.root.traverse(o => { if (o.name) names[o.name] = (names[o.name] || 0) + 1; });
    const pk = W.dyn.pk, ch = W.dyn.pkCheer;
    return { marks: Object.keys(W.marks), st: W.stats, names, lamps: W.lamps.length / 7, heli: !!(pk && pk.follow && pk.heli), cheer: ch ? ch.spots.length / 4 : 0, mv: !!W.dyn.mv, wind: !!W.dyn.wind };
  });
  const has = (k) => w.marks.includes(k);
  T.check('the Tour: the polka-dot arch of the Grand Prix de la Montagne over the road, its balloon on a rope beside it', has('Grand Prix de la Montagne') && has('balloon') && w.names.komArch === 1 && w.names.balloon === 1, w.marks.join(', '));
  T.check('the belvédère by the chapel and two pieces of the fans\' art in the meadows (the bicycle, the polka-dot jersey)', has('Belvédère') && has('art 1') && has('art 2') && w.st.art === 2 && w.names.fieldArt === 1, JSON.stringify(w.st));
  T.check('the road: chevron boards round all 18 lacets (4 each), rockfall nets on the high banks, street lamps (the villages, the lacets), reflectors',
    w.st.chevrons === 72 && w.st.nets >= 4 && w.lamps >= 30 && w.lamps === w.st.lamps && w.names.rockNets === 1 && w.names.reflectors === 1, JSON.stringify({ chevrons: w.st.chevrons, nets: w.st.nets, lamps: w.lamps }));
  T.check('the fans\' picnics by the camper vans (grills and their smoke), the far mountains round the horizon (two rings)', w.st.smoke >= 3 && w.names.mountains === 1 && w.names.mvMountains === 2, JSON.stringify({ smoke: w.st.smoke, names: w.names }));
  T.check('alive: the TV helicopter with the car, the runners, the birds and the paragliders; the crowds\' groups for the cheer\'s sound',
    w.heli && w.mv && w.names.runners === 1 && w.names.birds === 1 && w.names.paragliders === 1 && w.cheer > 20 && w.wind, JSON.stringify({ heli: w.heli, cheer: w.cheer }));

  // 3. the runners: drive on (frames drawn) until some fans set off along the road ahead of the car; they run on, beside the road
  const r = await page.evaluate(() => {
    const g = window.__game, R = Render.world.dyn.mv.run, T = g.race.track; g.pause();
    let k = 0, s0 = null, s1 = null, lat = 0;
    for (; k < 900; k++) { g.sim(1 / 30, true); Render.frame(1 / 30, 1, g.race.player, 'chase', {}); const o = R.L.find(q => q.on); if (o) { s0 = o.s; for (let j = 0; j < 45; j++) { g.sim(1 / 30, true); Render.frame(1 / 30, 1, g.race.player, 'chase', {}); } s1 = o.s; lat = Math.abs(o.o); break; } }
    return { k, s0, s1, lat, w: T.w, on: R.L.filter(q => q.on).length };
  });
  T.check('the runners: fans set off as the car comes up to them and run on along the road beside it (off the asphalt)', r.s0 != null && r.s1 > r.s0 + 3 && r.lat > r.w + 0.5, JSON.stringify(r));

  // 4. at night: the villages' lamps light the road (one glow each), the lanterns' glass and the reflectors lit; by day not
  await page.evaluate(() => Render.setAtmos({ season: 'summer', tod: 'night' }));
  await page.evaluate(() => { for (let k = 0; k < 3; k++) Render.frame(1 / 30, 1, window.__game.race.player, 'chase', {}); });
  const n = await page.evaluate(() => { const W = Render.world, L = Render.lookInfo(); return { halos: L.halos, windows: L.windows, night: W.nightU.value, lamp: W.dyn.mv.lampMat.emissive.r }; });
  await page.evaluate(() => Render.setAtmos({ season: 'summer', tod: 'day' }));
  await page.evaluate(() => { for (let k = 0; k < 3; k++) Render.frame(1 / 30, 1, window.__game.race.player, 'chase', {}); });
  const d = await page.evaluate(() => { const W = Render.world; return { halos: Render.lookInfo().halos, night: W.nightU.value, lamp: W.dyn.mv.lampMat.emissive.r }; });
  T.check('at night the lamps light the road (a glow for each), the lanterns and the reflectors lit, the windows too; by day none of it',
    n.halos === w.lamps && n.night === 1 && n.lamp > 0.9 && n.windows > 0 && d.halos === 0 && d.night === 0 && d.lamp === 0, JSON.stringify({ n, d }));

  // 5. the replay's TV cameras: the track's own (the helicopter over the car, the fixed ones over the ladder)
  const tv = await page.evaluate(() => { const g = window.__game, P = g.race.player; for (let k = 0; k < 20; k++) { g.sim(1 / 30, true); Render.frame(1 / 30, 1, P, 'tv', {}); }
    const c = Render.camera.position; return { up: +(c.y - (P.roadY || 0)).toFixed(1), d: +Math.hypot(c.x - P.x, c.z - P.z).toFixed(1) }; });
  T.check('the replay\'s TV cameras: high over the car (the helicopter or a fixed camera over the ladder)', tv.up > 15 && tv.d > 15, JSON.stringify(tv));

  T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
