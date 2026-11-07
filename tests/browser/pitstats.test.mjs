// The pit stops of the race in the game (107; Bathurst, Avstralija, two laps, the player on autopilot in at the end of its first lap,
// 390 × 844): right after the player's stop, when it is the race's fastest so far, a small notice on the HUD (the toast: "Najhitrejši
// postanek dirke doslej: 28,1 s", out of the lane); with a faster stop before it in the race: none. After the race the results get a table
// of every stop (Core Race pst.log: the driver, the lap, the time in the pit lane and standing in the box in brackets, the new set), the race's fastest highlighted and its award over the
// table ("Najhitrejši postanek dirke: …"); in English too.
//   node tests/browser/pitstats.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('pit stop statistics');
const srv = await serve();
const browser = await launch();
try {
  const run = async (faster) => {
    const { page, errors, ctx } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', weather: 'dry' }, { width: 390, height: 844 }, { seed: 21 });
    await startTrack(page, 'bathurst');
    const out = await page.evaluate(async (faster) => {
      const g = window.__game, R = g.race, P = R.player, toasts = [];
      new MutationObserver(() => { const t = document.getElementById('toast').textContent; if (t && toasts[toasts.length - 1] !== t) toasts.push(t); }).observe(document.getElementById('toast'), { childList: true, characterData: true, subtree: true });
      const frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      let asked = false, done = false;
      for (let k = 0; k < 4000 && !P.finished; k++) {
        if (P.lap >= 1 && !P.repairN && !P.pitDone) { P.pitWant = true; if (!asked && faster) R.pst.log.push({ c: R.cars.find(c => c !== P), lap: 1, t: 0.8, lane: 5, ty: 'M', at: R.time }); asked = true; }   // (in at the end of the first lap, as tests/browser/hud.test.mjs; a faster stop before it: made up)
        if (P.repairN && !P.inPit) P.pitWant = false;
        if (P.inPit || g.pitAuto.st) g.sim(1 / 30, false, 0, 0); else g.sim(done ? 1 : 0.25, true);
        // (stuck or the wrong way out on the circuit: put back on the road, like a player tapping Na progo. A rival's knock in the first
        // lap's crowd can turn the autopilot's car into a wall; it has no reverse gear and the race rescues only the rivals)
        if (!P.inPit && !P.finished && (P.stuckT > 3 || P.wrongT > 3)) R.rescue(P);
        if (P.pitDone) done = true;
        if (P.inPit || g.pitAuto.st || (done && toasts.length < 1)) await frame();
      }
      for (let k = 0; k < 400 && g.screen !== 'results'; k++) { g.sim(1, true); if (!P.inPit && !P.finished && (P.stuckT > 3 || P.wrongT > 3)) R.rescue(P); await frame(); }
      await new Promise(r => setTimeout(r, 600));
      const el = document.getElementById('res-laps'), rows = [...el.querySelectorAll('.ltab.stops tbody tr')];
      const L = R.pst.log, f = R.fastestStop();
      return { toasts, screen: g.screen, n: L.length, rows: rows.map(r => ({ cls: r.className, td: [...r.children].map(td => td.textContent) })), best: (el.querySelector('.stop-best') || {}).textContent || '',
        f: f && { me: f.c === P, t: f.lane, lap: f.lap }, mine: L.filter(e => e.c === P).map(e => e.lane), bestCol: rows.length ? getComputedStyle(rows.find(r => / best/.test(r.className)).children[2]).color : '' };
    }, faster);
    const en = await page.evaluate(() => { Lang.set('en'); const tr = Lang.tr, a = tr('Najhitrejši postanek dirke: {0}, {1} ({2}. krog)', 'You', '2.9 s', 2), b = tr('Postanki v boksih'), c = tr('Najhitrejši postanek dirke doslej: {0} s', '2.9'); Lang.set('sl'); return [a, b, c]; });
    await ctx.close();
    return Object.assign(out, { en, errors });
  };
  const a = await run(false);
  const fast = a.toasts.filter(t => /^Najhitrejši postanek dirke doslej: \d+,\d s$/.test(t));
  T.check('the player\'s stop the race\'s fastest so far: the notice on the HUD once, with its time', a.mine.length === 1 && fast.length === 1 && fast[0].includes(a.mine[0].toFixed(1).replace('.', ',')), JSON.stringify({ toasts: a.toasts, mine: a.mine }));
  T.check('the results: a table of every stop of the race (driver, lap, time, tyres)', a.screen === 'results' && a.n >= 1 && a.rows.length === a.n && a.rows.every(r => r.td.length === 4 && /^\d+$/.test(r.td[1]) && /^\d+,\d s \(\d+,\d\)/.test(r.td[2])) && a.rows.some(r => /\bme\b/.test(r.cls) && r.td[0] === 'Ti'),
    JSON.stringify(a.rows.slice(0, 4)));
  T.check('... the race\'s fastest stop highlighted (purple, a star) and its award over the table', a.rows.filter(r => / best/.test(r.cls)).length === 1 && /★/.test(a.rows.find(r => / best/.test(r.cls)).td[2]) && /^★ Najhitrejši postanek dirke: .+, \d+,\d s \(\d+\. krog\)$/.test(a.best.trim()) && (a.bestCol === 'rgb(17, 17, 17)' || a.bestCol === 'rgb(199, 125, 255)'),
    JSON.stringify({ best: a.best, col: a.bestCol }));
  T.check('in English: "Fastest pit stop of the race", "Pit stops", "... so far"', a.en[0] === 'Fastest pit stop of the race: You, 2.9 s (lap 2)' && a.en[1] === 'Pit stops' && a.en[2] === 'Fastest pit stop of the race so far: 2.9 s', a.en.join(' | '));
  const b = await run(true);
  T.check('a faster stop earlier in the race: no notice', b.mine.length === 1 && !b.toasts.some(t => /^Najhitrejši postanek/.test(t)) && b.f && !b.f.me && b.rows.length === b.n, JSON.stringify({ toasts: b.toasts, f: b.f }));
  T.check('no page errors', !a.errors.length && !b.errors.length, a.errors.concat(b.errors).slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close(); await srv.close();
}
T.done();
