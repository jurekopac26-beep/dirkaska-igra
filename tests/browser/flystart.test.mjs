// The flying start of a race up an open road (Race opts.flying, Race._flyColumn, game.js flyStep): no start lights; the moment the race
// begins it is already under way: the cars in one line up the road, ~10 s from the player's car at the back to the leader, the player's car
// 3 s of its pace below the start line on the autopilot, a number at each whole second (LETEČI START · PREVZAMEŠ ČEZ 3, then 2, 1; the
// commentator only counts: Three! Two! One!), and the moment it is over the line VOZIŠ TI! (The race has started!) and the player's own car
// (the touch controls' autopilot mark off). No one passes until then. Vršič's race and Pikes Peak's (its short road below the line: slower);
// the time trial on the same road keeps its standing start, and a circuit's race its lights.
//   node tests/browser/flystart.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('flying start (open roads)');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase' }, { width: 844, height: 390 });
  // the race's first moments, stepped by hand: the message and the commentator's lines at each number, the autopilot's mark, the order, the
  // player's car at the start line as it takes over
  const look = () => page.evaluate(async () => {
    const g = window.__game, $ = (id) => document.getElementById(id), r = g.race, P = r.player, out = [];
    g.pause();
    const order = () => r.cars.slice().sort((a, b) => b.dist - a.dist).map(c => c.id).join();
    const o0 = order(), line = r.cars.slice().sort((a, b) => a.grid - b.grid), lead = line.slice(1).reduce((a, c, k) => a + (line[k].dist - c.dist) / Math.max(5, c.speed), 0);   // (each gap at the pace of the car behind)
    let msg = '', kept = true, at = null, d0 = P.dist;
    while (r.time < 6 && at == null) {
      const was = r.flyOn; g.sim(1 / 60, true); if (order() !== o0) kept = false;
      const m = $('h-msg').textContent; if (m !== msg) { msg = m; out.push({ t: +r.time.toFixed(2), msg: m, ap: $('touch').classList.contains('ap'), d: +P.dist.toFixed(1) }); }
      if (was && !r.flyOn) at = { t: +r.time.toFixed(2), d: +P.dist.toFixed(2), ap: $('touch').classList.contains('ap'), msg: m };
    }
    g.resume();
    return { out, at, kept, lead: +lead.toFixed(1), d0: +d0.toFixed(0), fly: r.opts.flying, lch: !!r.lch, tt: r.timeTrial, cars: r.cars.length, lights: $('h-lights').classList.contains('show') };
  });
  for (const id of ['vrsic', 'pikes']) {
    await startTrack(page, id, 'race');
    const r = await look(), msgs = r.out.map(o => o.msg);
    T.check(`${id}: the race begins at once, no lights, the cars in one line (the player's car at the back, ~10 s behind the leader, below the start line)`,
      r.fly > 0 && !r.lch && !r.tt && r.cars === 13 && !r.lights && r.d0 < 0 && r.lead > 8 && r.lead < 14, `${r.lead} s behind the leader, ${-r.d0} m below the line`);
    T.check(`${id}: the countdown 3, 2, 1 on the autopilot, then VOZIŠ TI! the moment the player's car is over the start line (~3 s), no one passing until then`,
      msgs[0] === 'LETEČI START · PREVZAMEŠ ČEZ 3' && msgs.includes('PREVZAMEŠ ČEZ 2') && msgs.includes('PREVZAMEŠ ČEZ 1') && r.at && r.at.msg === 'VOZIŠ TI!' && !r.at.ap && r.at.d >= 0 && r.at.d < 2 && r.at.t > 2.9 && r.at.t < 3.8 && r.kept,
      JSON.stringify(r.out) + ' ' + JSON.stringify(r.at));
  }
  // the same road's time trial and a circuit's race: the standing start with the lights, as ever
  for (const [id, mode] of [['vrsic', 'tt'], ['jezero', null]]) {
    await startTrack(page, id, mode);
    const r = await page.evaluate(() => { const g = window.__game; return { fly: g.race.opts.flying || 0, phase: g.phase, lights: document.getElementById('h-lights').classList.contains('show') }; });
    T.check(`${id}${mode ? ' (' + mode + ')' : ''}: no flying start, the lights`, !r.fly && (r.phase === 'intro' || r.phase === 'lights'), JSON.stringify(r));
  }
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
