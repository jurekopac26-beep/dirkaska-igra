// Qualifying and the ghost of the best lap on a circuit, through the menus (the Red Bull Ring, the player on autopilot): Start begins
// with qualifying (the player alone on the straight before the line, no lights, "Preskoči kvalifikacije" in the pause menu); the flying
// lap to the line; the rivals' laps and the grid on the results screen (every driver by time, the player's row, "Na štart"); the race on
// that grid; the flying lap kept as the ghost and replayed on the next qualifying lap on the lap clock (from the line on, not on the
// run-up); "Ponovi krog" drives the lap again and keeps the rivals' laps; "Preskoči" goes to the usual grid (12th); qualifying off:
// Start goes straight to the race; a time trial never qualifies.
//   node tests/browser/quali.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('qualifying and the lap ghost');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', quali: 1, track: 'rbring' }, { width: 844, height: 390 });
  const act = (a) => page.evaluate((a) => window.__game.onAction(a), a);
  // every ghost the game draws (Render.setGhost with a pose), the latest one and how far it is from the player
  await page.evaluate(() => { const orig = Render.setGhost; Render.setGhost = (g, drop) => { const P = window.__game.race && window.__game.race.player; window.__gh = g ? { op: g.op, d: P ? Math.hypot(g.x - P.x, g.z - P.z) : -1 } : null; return orig(g, drop); }; });
  // the ghost of the next drawn frame (paused: ghShow runs on every frame; a software-rendered frame can take long, so wait for one)
  const ghostNow = () => page.evaluate(async () => { window.__gh = undefined; for (let i = 0; i < 400 && window.__gh === undefined; i++) await new Promise(r => setTimeout(r, 50)); return window.__gh; });
  const state = () => page.evaluate(() => { const g = window.__game, r = g.race, P = r && r.player;
    return { quali: !!(r && r.quali), cars: r ? r.cars.length : 0, back: P ? Math.round(-P.dist) : 0, grid: P ? P.grid : 0, lap: P ? P.lap : -1, phase: g.phase, screen: g.screen, q: g.qual,
      tot: document.getElementById('h-tot').textContent, skip: !document.getElementById('pause-skip').classList.contains('off'), restart: document.getElementById('pause-restart').textContent }; });
  // drive on autopilot (paused: stepped here, not in real time) until the flying lap is over, then let the frames bring in the rivals' laps
  const qualiLap = async () => {
    await page.evaluate(() => { const g = window.__game; g.pause(); for (let i = 0; i < 400 && g.phase !== 'done'; i++) g.sim(1, true); g.resume(); });
    await page.waitForFunction(() => window.__game.screen === 'results', null, { timeout: 180000 });
    return page.evaluate(() => { const rows = [...document.querySelectorAll('#res-table tbody tr')].map(tr => [...tr.children].map(td => td.textContent));
      const t = (s) => { const m = /^(\d+):(\d+(?:\.\d+)?)$/.exec(s); return m ? +m[1] * 60 + +m[2] : NaN; };
      const gh = JSON.parse(localStorage.getItem('tdgp-ghost-rbring@cs') || 'null');
      return { rows, times: rows.map(r => t(r[3])), me: rows.findIndex((r, i) => document.querySelectorAll('#res-table tbody tr')[i].classList.contains('me')) + 1,
        pos: document.getElementById('res-pos').textContent, sub: document.getElementById('res-sub').textContent, head: [...document.querySelectorAll('#res-table thead th')].map(th => th.textContent).join(','),
        btn: document.getElementById('res-restart').dataset.act + ':' + document.getElementById('res-restart').textContent, lap: window.__game.race.player.lapTimes[0], ghost: gh && { lap: gh.lap, t: gh.t, n: gh.n } }; });
  };

  // 1. Start: qualifying first, alone on the straight before the line (the run-up), no lights
  await startTrack(page, 'rbring');
  const s0 = await state();
  T.check('Start with qualifying on: the qualifying lap first, the player alone ~400 m before the line, no position on the HUD', s0.quali && s0.cars === 1 && s0.back === 400 && s0.tot === '' && s0.q && s0.q.n === 12 && s0.q.id === 'rbring', JSON.stringify(s0));
  await page.evaluate(() => window.__game.sim(3, true));
  const s1 = await state();
  T.check('qualifying: no start lights, the car sets off at once; still before the line (lap 0)', s1.phase === 'racing' && s1.lap === 0 && s1.back < 400, JSON.stringify({ phase: s1.phase, lap: s1.lap, back: s1.back }));
  await page.evaluate(() => window.__game.pause());
  const sp = await state();
  T.check('pause menu in qualifying: "Ponovi krog" and "Preskoči kvalifikacije"', sp.screen === 'pause' && sp.skip && sp.restart === 'Ponovi krog', JSON.stringify({ skip: sp.skip, restart: sp.restart }));
  const g0 = await ghostNow();
  T.check('no ghost yet (no lap driven before)', !g0, JSON.stringify(g0));
  await page.evaluate(() => window.__game.resume());

  // 2. the flying lap to the line; the rivals' laps; the grid on the results screen
  const r1 = await qualiLap();
  const sorted = r1.times.every((t, i) => i === 0 || t >= r1.times[i - 1]);
  T.check('results: all 13 drivers with their times, fastest first, the gap to pole, the player\'s row', r1.rows.length === 13 && r1.times.every(isFinite) && sorted && r1.me >= 1 && r1.head === '#,Voznik,Avto,Čas,Zaostanek' && r1.rows[r1.me - 1][1] === 'Ti',
    r1.rows.map(r => r[1] + ' ' + r[3]).join(', '));
  T.check('results: the lap time, the starting place, "Na štart"', r1.pos === r1.me + '.' && new RegExp('Na štartu boš ' + r1.me + '\\. od 13').test(r1.sub) && Math.abs(r1.times[r1.me - 1] - r1.lap) < 0.002 && r1.btn === 'quali-go:Na štart', r1.sub + ' / ' + r1.btn);
  T.check('the flying lap kept as the lap ghost (lap: 1, its time)', !!r1.ghost && r1.ghost.lap === 1 && Math.abs(r1.ghost.t - r1.lap) < 1e-6 && r1.ghost.n > 500, JSON.stringify(r1.ghost));
  const q1 = await state();

  // 3. the race on that grid
  await act('quali-go'); await page.waitForTimeout(400);
  const race = await page.evaluate(() => { const r = window.__game.race; return { quali: r.quali, n: r.cars.length, grid: r.player.grid, order: r.cars.slice().sort((a, b) => a.grid - b.grid).map(c => c.isPlayer ? 'Ti' : c.name), seed: r.opts.seed }; });
  T.check('Na štart: the race, the player where qualifying put him, the rivals in the order of their times', !race.quali && race.n === 13 && race.grid === r1.me && race.order.join() === r1.rows.map(r => r[1]).join() && race.seed === q1.q.seed,
    race.order.join(', '));
  await act('restart'); await page.waitForTimeout(400);
  const again = await page.evaluate(() => { const r = window.__game.race; return { quali: r.quali, grid: r.player.grid, first: r.cars.find(c => c.grid === 1).name }; });
  T.check('Ponovi dirko: the same grid again (no new qualifying)', !again.quali && again.grid === r1.me && again.first === (r1.me === 1 ? 'TI' : r1.rows[0][1]), JSON.stringify(again));

  // 4. the next qualifying: the ghost of the best lap, on the lap clock from the line (not on the run-up)
  await act('to-title'); await page.waitForTimeout(300);
  await startTrack(page, 'rbring');
  await page.evaluate(() => { const g = window.__game; g.pause(); g.sim(4, true); });
  const gRun = await ghostNow();
  await page.evaluate(() => { const g = window.__game; for (let i = 0; i < 60 && !(g.race.player.lap >= 1 && g.race.time - g.race.player.lapStart > 8); i++) g.sim(0.5, true); });
  const gLap = await ghostNow();
  T.check('the next qualifying: no ghost on the run-up, the ghost of the best lap on the flying lap, right beside the player (the same autopilot line, the same lap clock)', !gRun && !!gLap && gLap.op > 0.2 && gLap.d >= 0 && gLap.d < 12, JSON.stringify({ gRun, gLap }));

  // 5. "Ponovi krog": the lap again, the rivals' laps already driven stay; "Preskoči": the usual grid
  await page.waitForFunction(() => window.__game.qual.sims >= 2, null, { timeout: 120000 });   // (a few of the rivals' laps done: the frames run them, also in the pause)
  const k0 = (await state()).q;
  await act('restart'); await page.waitForTimeout(300);
  const k1 = await state();
  T.check('Ponovi krog: the qualifying lap again, the rivals\' laps (and the seed) kept', k1.quali && k1.back === 400 && k1.q.seed === k0.seed && k0.sims >= 2 && k1.q.sims >= k0.sims, JSON.stringify({ before: k0, after: k1.q }));
  await act('quali-skip'); await page.waitForTimeout(400);
  const sk = await state();
  T.check('Preskoči kvalifikacije: straight to the race, the usual grid (12th of 13)', !sk.quali && sk.cars === 13 && sk.grid === 12 && sk.screen === 'none' && !sk.q, JSON.stringify(sk));

  // 6. qualifying off: Start goes straight to the race; a time trial never qualifies
  await act('to-title'); await page.waitForTimeout(200); await act('to-track'); await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector('[data-set="quali"] button[data-v="0"]').click());
  await startTrack(page, 'rbring');
  const off = await state();
  await act('to-title'); await page.waitForTimeout(200); await act('to-track'); await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector('[data-set="quali"] button[data-v="1"]').click());
  await startTrack(page, 'pikes');
  const tt = await page.evaluate(() => { const r = window.__game.race; return { tt: r.timeTrial, quali: r.quali, n: r.cars.length }; });
  T.check('qualifying off: Start goes straight to the race; the Pikes Peak time trial has no qualifying', !off.quali && off.cars === 13 && off.grid === 12 && tt.tt && !tt.quali && tt.n === 1, JSON.stringify({ off: { quali: off.quali, cars: off.cars, grid: off.grid }, tt }));

  T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
