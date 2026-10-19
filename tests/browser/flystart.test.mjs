// The flying start of a race up an open road (Race opts.flying, game.js flyStep): no start lights; the moment the race begins every car is
// already rolling up the road (FLY_V, ~54 km/h) and the autopilot drives the player's car for its first 3 s of race time, a number at each
// whole second (LETEČI START · PREVZAMEŠ ČEZ 3, then 2, 1), then VOZIŠ TI! and the player's own car (the touch controls' autopilot mark off).
// Vršič's race and Pikes Peak's (the newest of the 19 roads in the race; 22 cars, at Pikes Peak in rows abreast below the line), and the one
// circuit with a flying start, the Nordschleife's Circuit race (def.flyStart: 100 cars, the last ~750 m behind the line); the time trial on the
// same road keeps its standing start, a circuit's race its lights, and so does a championship round on the Nordschleife (its own 20 cars).
//   node tests/browser/flystart.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('flying start (open roads)');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase' }, { width: 844, height: 390 });
  // the race's first moments, stepped by hand: the speeds of the cars, the message, the autopilot's mark, who drives
  const look = () => page.evaluate(async () => {
    const g = window.__game, $ = (id) => document.getElementById(id), out = [];
    g.pause();
    for (const t of [0, 0.5, 1.5, 2.5, 3.2]) {
      while (g.race.time < t) g.sim(1 / 60, true);
      out.push({ t: +g.race.time.toFixed(2), phase: g.phase, min: Math.min(...g.race.cars.map(c => c.speed)), lights: $('h-lights').classList.contains('show'), msg: $('h-msg').textContent, ap: $('touch').classList.contains('ap') });
    }
    const r = g.race; g.resume();
    return { out, fly: r.opts.flying, lch: !!r.lch, tt: r.timeTrial, cars: r.cars.length };
  });
  for (const id of ['vrsic', 'pikes', 'nring']) {
    await startTrack(page, id, id === 'nring' ? null : 'race');
    const r = await look(), [a, , , c, d] = r.out, N = id === 'nring' ? 100 : 22;
    T.check(`${id}: the race begins at once, no lights, every car of ${N} already rolling (over 40 km/h), the player's car on the autopilot`,
      r.fly > 0 && !r.lch && !r.tt && r.cars === N && a.phase === 'racing' && !a.lights && a.min * 3.6 > 40 && a.ap && /^LETEČI START · PREVZAMEŠ ČEZ 3$/.test(a.msg), JSON.stringify(r.out[0]));
    T.check(`${id}: the countdown on race time (PREVZAMEŠ ČEZ 1 before 3 s), then VOZIŠ TI! and the player's own car`,
      c.msg === 'PREVZAMEŠ ČEZ 1' && c.ap && d.msg === 'VOZIŠ TI!' && !d.ap, JSON.stringify(r.out.slice(1)));
  }
  // the same road's time trial and a circuit's race: the standing start with the lights, as ever
  for (const [id, mode] of [['vrsic', 'tt'], ['jezero', null]]) {
    await startTrack(page, id, mode);
    const r = await page.evaluate(() => { const g = window.__game; return { fly: g.race.opts.flying || 0, phase: g.phase, lights: document.getElementById('h-lights').classList.contains('show') }; });
    T.check(`${id}${mode ? ' (' + mode + ')' : ''}: no flying start, the lights`, !r.fly && (r.phase === 'intro' || r.phase === 'lights'), JSON.stringify(r));
  }
  // a championship round on the Nordschleife (Legende, its last round; the rounds before it driven): its own 19 rivals and the lights
  await page.evaluate(() => { const K = Core.champKeys(19), d = Core.CHAMPS.find(c => c.id === 'legende'), i = d.tracks.indexOf('nring');
    localStorage.setItem('tdgp-champ', JSON.stringify({ v: 1, id: 'legende', diff: 1, n: 19, rounds: d.tracks.slice(0, i).map(t => ({ track: t, order: K.slice() })) })); });
  await page.reload(); await page.waitForFunction(() => !!(window.__game && window.__game.screen === 'title'), null, { timeout: 60000 });
  await page.evaluate(async () => { const g = window.__game; await new Promise(r => setTimeout(r, 500)); g.onAction('to-champ'); await new Promise(r => setTimeout(r, 300)); g.onAction('champ-go'); });
  await page.waitForFunction(() => { const g = window.__game; return !!(g.race && g.race.champ && g.race.track.def.id === 'nring'); }, null, { timeout: 120000 });
  { const r = await page.evaluate(() => { const g = window.__game; return { fly: g.race.opts.flying || 0, cars: g.race.cars.length, lch: !!g.race.lch, phase: g.phase }; });
    T.check('nring, a championship round (Legende): its 20 cars, no flying start, the lights', !r.fly && r.cars === 20 && r.lch && (r.phase === 'intro' || r.phase === 'lights'), JSON.stringify(r)); }
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
