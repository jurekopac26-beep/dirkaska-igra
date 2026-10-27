// Repeatable races (sklop 16 of docs/orodje-za-napake.md): the quick entry is the test mode. Its race's seed is the address's (?seme=<n>,
// else 1) and every random event that changes the race comes from it (Race opts.repro: Core rand; the weather left to chance and the lights'
// hold: game.js grand). Bathurst, the weather at random, damage and failures on, driven on the autopilot to 25 s: twice with seme=5 (the
// page's Math.random seeded differently each time) the same recording and the same cars, with seme=6 another race.
//   node tests/browser/repro.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('repro');
const srv = await serve();
const browser = await launch();
const SET = { weather: 'random', damage: 2, faults: 1 };
async function run(seme, seed) {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?proga=bathurst&t=25' + (seme ? '&seme=' + seme : ''), SET, { width: 640, height: 360 }, { seed });
  await page.waitForFunction(() => window.__game.quick && window.__game.quick.done, null, { timeout: 240000 });
  const s = await page.evaluate(() => { const g = window.__game, r = g.race, n = (v) => (v || 0).toPrecision(9);
    return { repro: g.repro, seed: r.opts.seed, time: +r.time.toFixed(3), rain: r.rain, rec: g.recSum(), phase: g.phase,
      cars: r.cars.map(c => [n(c.x), n(c.z), n(c.h), n(c.vl), n(c.dmg), n(c.dist), c.pos].join(' ')).join('\n') }; });
  await ctx.close();
  return { s, errors };
}
try {
  const a = await run(5, 101), b = await run(5, 202), c = await run(6, 101), d = await run(0, 303);
  T.check('?seme=5: the test mode, the race\'s seed 5, repeatable (Race opts.repro), 25 s driven', a.s.repro && a.s.repro.seed === 5 && a.s.repro.on && a.s.seed === 5 && a.s.phase === 'racing' && a.s.time >= 25 && a.s.rec && a.s.rec.n > 400, JSON.stringify(Object.assign({}, a.s, { cars: undefined })));
  T.check('the same race twice (Math.random seeded otherwise): the same recording, frame for frame', a.s.rec.h === b.s.rec.h && a.s.rec.n === b.s.rec.n, JSON.stringify([a.s.rec, b.s.rec]));
  T.check('… the same cars there (where, heading, speed, damage, distance, place), the same weather', a.s.cars === b.s.cars && a.s.rain === b.s.rain && a.s.time === b.s.time, a.s.cars === b.s.cars ? '' : a.s.cars.split('\n').find((l, i) => l !== b.s.cars.split('\n')[i]));
  T.check('?seme=6: another race (another recording, the cars elsewhere)', c.s.repro.seed === 6 && c.s.rec.h !== a.s.rec.h && c.s.cars !== a.s.cars, JSON.stringify([a.s.rec, c.s.rec]));
  T.check('no seme: the test mode with seed 1', d.s.repro && d.s.repro.seed === 1 && d.s.repro.on && d.s.seed === 1);
  T.check('no errors on the pages', ![a, b, c, d].some(r => r.errors.length), [a, b, c, d].map(r => r.errors.slice(0, 2).join(' | ')).join(' / '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
