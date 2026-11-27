// The race behind the results after a replay (the Jezero Ring, the player on autopilot; the race waits on the pause, so no step of it comes
// between the pictures taken here): after the finish the automatic Najboljši trenutek and the results' Posnetek pose the race's own cars.
// When the replay is left (Preskoči, Končaj) every car, the rivals' and the player's, is again exactly where and as the race had it before
// the replay (where it is and how fast, its lap and its place on the road, its wheels, a roll or a fall of its own), with the race's clock,
// its safety car and red flag: behind the results the race goes on from there and is recorded on, never from the replay's last picture.
//   node tests/browser/replay-cilj.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('the race behind the results after a replay');
const srv = await serve();
const browser = await launch();
// (every car as the race has it: what the replay poses, rpPose, rpFall and rpPit in js/game.js, and where the race counts it)
const SNAP = `(() => { const g = window.__game, r = g.race; return { time: r.time, phase: g.phase, screen: g.screen, rp: g.replay && { t: g.replay.t, hl: !!g.replay.hl }, sc: !!(r.fl && r.fl.sc), red: !!(r.fl && r.fl.red),
  cars: r.cars.map(c => ({ me: c === r.player, fin: !!c.finished, x: c.x, y: c.y, z: c.z, h: c.h, px: c.px, py: c.py, pz: c.pz, ph: c.ph, vl: c.vl, vx: c.vx, vy: c.vy, vz: c.vz, delta: c.delta, w: c.w, beta: c.beta, air: c.air, axF: c.axF,
    gear: c.gear, rpm: c.rpm, inBrk: c.inBrk, inHand: c.inHand, roadY: c.roadY, onCurb: c.onCurb, lap: c.lap, dist: c.dist, qi: c.q && c.q.i, qs: c.q && c.q.s, qd: c.q && c.q.d, rl: !!c.rl, fall: c.fall ? (c.fall.rp ? 'rp' : 'own') : '',
    pit: c.rpPit ? 1 : 0, ws: c.ws ? Array.from(c.ws).join() : '' })) }; })()`;
const same = (a, b) => a === b || (a !== a && b !== b);
// (how far the second picture is from the first: the cars with any field changed, the rivals among them, the farthest moved, the fields)
function diff(a, b) {
  let differ = 0, rivals = 0, far = 0; const keys = new Set();
  a.cars.forEach((c, k) => {
    const d = b.cars[k] || {}, bad = Object.keys(c).filter(K => K !== 'me' && K !== 'fin' && !same(c[K], d[K]));
    if (!bad.length) return;
    differ++; if (!c.me) rivals++; for (const K of bad) keys.add(K); far = Math.max(far, Math.hypot(c.x - d.x, c.z - d.z) || 0);
  });
  return { cars: a.cars.length, differ, rivals, farM: +far.toFixed(1), keys: [...keys].join(','), time: [a.time, b.time], sc: [a.sc, b.sc], red: [a.red, b.red] };
}
const asWas = (a, b) => a.cars.length === b.cars.length && !diff(a, b).differ && a.time === b.time && a.sc === b.sc && a.red === b.red;
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', track: 'jezero', hlv: 1 }, { width: 480, height: 270 });
  const frames = (n) => page.evaluate((n) => new Promise(res => { let k = 0; const f = () => ++k >= n ? res() : requestAnimationFrame(f); requestAnimationFrame(f); }), n);
  await startTrack(page, 'jezero');
  // (the race to its end on autopilot, at most 600 s, waiting on the pause: only these steps move it, behind the results it stands. Stuck or
  // the wrong way round the player's car is put back on the road after each 2 s, like tapping Na progo: the autopilot has no reverse gear.
  // The cars' picture in the same step as the finish: the best moment has begun (hlvAuto), no frame of it has been drawn yet)
  const before = await page.evaluate(`(() => { const g = window.__game; g.pause();
    for (let k = 0; k < 300 && g.phase !== 'done'; k++) { g.sim(2, true); const P = g.race && g.race.player; if (P && !P.inPit && !P.finished && (P.stuckT > 3 || P.wrongT > 3)) g.race.rescue(P); }
    return ${SNAP}; })()`);
  T.check('the race is over and the automatic "Najboljši trenutek" has begun', before.phase === 'done' && !!before.rp && before.cars.length > 10 && before.cars.some(c => !c.me),
    JSON.stringify({ phase: before.phase, screen: before.screen, rp: before.rp, cars: before.cars.length }));

  await frames(6);
  const during = await page.evaluate(SNAP), d1 = diff(before, during);
  T.check('the best moment plays: the replay poses the race\'s own cars (most of them elsewhere than the race has them)', !!during.rp && d1.differ > before.cars.length / 2, JSON.stringify({ rp: during.rp, vs: d1 }));
  const after = await page.evaluate(`(() => { window.__game.onAction('rp-skip'); return ${SNAP}; })()`);
  T.check('Preskoči: the results, and every car (the rivals\' and the player\'s) exactly as the race had it before the best moment (where, how fast, its lap, where on the road); the race\'s clock, safety car and red flag as they were',
    after.screen === 'results' && !after.rp && asWas(before, after), JSON.stringify({ screen: after.screen, rp: after.rp, vs: diff(before, after) }));

  // the results' Posnetek: the race from its start
  const before2 = await page.evaluate(`(() => { const s = ${SNAP}; window.__game.onAction('replay'); return s; })()`);
  await frames(6);
  const during2 = await page.evaluate(SNAP), d2 = diff(before2, during2);
  T.check('Posnetek on the results plays the race from its start: its cars posed again', !!during2.rp && !during2.rp.hl && d2.differ > before2.cars.length / 2, JSON.stringify({ rp: during2.rp, vs: d2 }));
  const after2 = await page.evaluate(`(() => { window.__game.onAction('rp-exit'); return ${SNAP}; })()`);
  T.check('Končaj: the results, and every car again exactly as the race had it before the replay; the race\'s clock, safety car and red flag as they were',
    after2.screen === 'results' && !after2.rp && asWas(before2, after2), JSON.stringify({ screen: after2.screen, rp: after2.rp, vs: diff(before2, after2) }));
  T.check('two replays watched: the race waiting behind the results is as it was at the finish', asWas(before, after2), JSON.stringify(diff(before, after2)));

  // (the best moment's video, read from memory in pieces: the browser may leave a read unfinished, net::ERR_ABORTED, which is no error)
  const errs = errors.filter(e => !/^request failed: blob:/.test(e));
  T.check('no page errors', !errs.length, errs.slice(0, 3).join(' | '));
} catch (e) {
  T.check('the test ran through', false, String(e && e.message || e).split('\n')[0]);
} finally {
  await browser.close(); await srv.close();
}
T.done();
