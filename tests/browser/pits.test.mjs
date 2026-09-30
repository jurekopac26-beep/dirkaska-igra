// Bakreni gozd (gozd): a full race on autopilot with one pit stop on lap 2. The car must stop in its box, the crew
// must go out, work (car up on the jacks) and clear, the repair must finish (and the car leave on new tyres), and all 13
// cars must finish the race (the race runs on after the player's finish until the last car is in: a rival that stopped
// for repairs comes home later).
//   node tests/browser/pits.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('pits (gozd)');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase', zoom: 1.2 }, { width: 640, height: 360 });
  await startTrack(page, 'gozd');
  await page.evaluate(() => { window.__game.pause(); const e = document.querySelector('.screen.show'); if (e) e.style.display = 'none'; });
  const states = [], modes = new Set(); let lastSt, maxLift = 0, r, after = 0, tyreIn = null, tyreOut = null;
  for (let k = 0; k < 900; k++) {
    // 1 s of game time in 20 steps, the renderer (and the pit crew) stepped along without drawing
    r = await page.evaluate(() => {
      const g = window.__game, P = g.race.player, st = []; Render.scene.visible = false;
      for (let i = 0; i < 20; i++) { g.sim(0.05, true); Render.frame(0.05, 1, P, g.S.camera, {}); const c = Render.crew; st.push([P.pitState, c && c.mode, c ? c.lift : 0, P.tyre]); }
      if (P.lap === 2 && !P.repairN && !P.inPit) P.pitWant = true;
      if (P.repairN && !P.inPit) P.pitWant = false;
      Render.scene.visible = true;
      return { phase: g.phase, fin: !!P.finished, t: g.race.time, repairN: P.repairN || 0, st, finished: g.race.cars.filter(c => c.finished).length, n: g.race.cars.length };
    });
    for (const [s, m, l, w] of r.st) { if (s !== lastSt) { states.push(`${r.t.toFixed(1)} s ${s}`); if (s === 'repair') tyreIn = w; if (s === 'done') tyreOut = w; lastSt = s; } if (m) modes.add(m); maxLift = Math.max(maxLift, l); }
    if (r.fin && r.finished === r.n) break;
    if (r.phase === 'done' && k > 5 && ++after > 90) break;   // (at most 90 s after the results)
  }
  const seq = states.map(s => s.split(' ').pop()).join('>');
  T.check('pit stop: stop > repair > done', /stop>repair>done/.test(seq), states.join(' > '));
  T.check('the crew goes out, works and clears', ['out', 'work', 'clear'].every(m => modes.has(m)), [...modes].join(','));
  T.check('the car goes up on the jacks', maxLift > 0.05, `max lift ${maxLift.toFixed(3)} m`);
  T.check('repaired once', r.repairN === 1, `repairs ${r.repairN}`);
  T.check('new tyres at the stop', tyreIn > 0.15 && tyreOut < 0.01, `tyre wear ${tyreIn == null ? '-' : tyreIn.toFixed(2)} in, ${tyreOut == null ? '-' : tyreOut.toFixed(2)} out`);
  T.check('player finishes, all cars finish', r.fin && r.finished === r.n, `${r.finished}/${r.n} after ${r.t.toFixed(1)} s`);
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
