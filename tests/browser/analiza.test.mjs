// Analiza kroga in the game (js/analiza.js, the hooks in js/game.js »the lap analysis«, docs/analiza-kroga.md): a race on Jezero (the
// short track of the feature tests) on autopilot from a fresh profile. The first lap (from the grid) is not kept, the second becomes the
// best lap (stored under tdgp-analiza-<record key>), the third is compared with it: the minimap carries its colours for a while and the tip
// comes under the clock after the lap's time. At the finish the results show the analysis (#res-an): a map with red or green on it, the
// tip, ‹ › through the laps; upright (360 x 640) and lying (640 x 360) inside the screen's width. A second race starts from the stored lap.
//   node tests/browser/analiza.test.mjs
import { serve, launch, openGame, startTrack, driveToResults, checker } from './lib.mjs';

const T = checker('the lap analysis (Analiza kroga)');
const srv = await serve();
const browser = await launch();
const ID = 'jezero';
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'low', shadows: 0, track: ID, mode: 'race', length: 'long' }, { width: 640, height: 360 }, { seed: 3 });
  await startTrack(page, ID);
  // laps on autopilot, the HUD drawn between the seconds (its tip, the minimap's colours)
  const lapRun = (want) => page.evaluate(async (want) => {
    const g = window.__game, P = g.race.player, wait = () => new Promise(r => requestAnimationFrame(r)); g.pause();
    for (let k = 0; k < 600 && P.lapTimes.length < want; k++) { g.sim(1, true); if (P.stuckT > 3 || P.wrongT > 3) g.race.rescue(P); await wait(); }
    const A = g.analiza; return { laps: P.lapTimes.length, n: A ? A.list.length : -1, hudT: A ? A.hudT : 0, pend: A ? A.pend : '', ref: !!(A && A.ref), key: Object.keys(localStorage).filter(k => k.startsWith('tdgp-analiza-')) };
  }, want);
  const l2 = await lapRun(2);
  T.check('lap 1 (from the grid) not kept, lap 2 the best lap, stored', l2.laps >= 2 && l2.ref && l2.key.length === 1 && l2.n === 1, JSON.stringify(l2));
  const l3 = await lapRun(3);
  const hud = await page.evaluate(async () => {
    const g = window.__game, A = g.analiza, r = A.list[A.list.length - 1], wait = () => new Promise(res => requestAnimationFrame(res));
    const mm = document.getElementById('minimap'), c = mm.getContext('2d'), d = c.getImageData(0, 0, mm.width, mm.height).data;
    let col = 0; for (let i = 0; i < d.length; i += 4) { const R = d[i], G = d[i + 1], B = d[i + 2]; if ((R > 180 && G < 120 && B < 110) || (G > 170 && R < 120 && B < 150)) col++; }
    let tip = ''; g.resume(); for (let k = 0; k < 400 && !tip; k++) { await wait(); const el = document.getElementById('h-split'); if (el.classList.contains('an')) tip = el.textContent; } g.pause();
    return { res: !!r.res, delta: r.res ? +r.res.delta.toFixed(3) : null, kind: r.res ? r.res.tip.kind : '', col, hudT: +A.hudT.toFixed(2), tip };
  });
  T.check('lap 3 compared with the best lap: the minimap red and green for a while', l3.n === 2 && hud.res && hud.col > 4, JSON.stringify({ l3, hud: { col: hud.col, kind: hud.kind, delta: hud.delta } }));
  T.check('the difference and the tip under the clock after the lap time', /^[+−]\d+,\d\d s · ./.test(hud.tip), hud.tip);
  await driveToResults(page);
  const res = await page.evaluate(async () => {
    const g = window.__game, el = document.getElementById('res-an'), cv = document.getElementById('res-an-cv'), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
    let col = 0; for (let i = 0; i < d.length; i += 4) { const R = d[i], G = d[i + 1], B = d[i + 2]; if ((R > 180 && G < 120 && B < 110) || (G > 170 && R < 120 && B < 150)) col++; }
    const lap0 = document.getElementById('res-an-lap').textContent; g.onAction('an-prev'); const lap1 = document.getElementById('res-an-lap').textContent;
    return { on: !el.classList.contains('off') && el.getBoundingClientRect().height > 40, col, n: g.analiza.list.length, lap0, lap1, tip: document.getElementById('res-an-tip').textContent, z: document.getElementById('res-an-z').children.length };
  });
  T.check('the results: the analysis with its map (red or green), the tip', res.on && res.col > 20 && res.tip.length > 5, JSON.stringify(res));
  T.check('‹ goes to the lap before', res.n >= 2 && res.lap0 !== res.lap1, res.lap0 + ' → ' + res.lap1);
  for (const [w, h] of [[360, 640], [640, 360]]) {
    await page.setViewportSize({ width: w, height: h }); await page.evaluate(() => new Promise(r => setTimeout(r, 300)));
    const b = await page.evaluate(() => { window.__game.onAction('an-next'); const r = document.getElementById('res-an').getBoundingClientRect(), c = document.getElementById('res-an-cv').getBoundingClientRect(); return { l: r.left, r: r.right, cw: c.width, ch: c.height, W: innerWidth, sw: document.documentElement.scrollWidth }; });
    T.check(`${w} x ${h}: inside the screen's width, the map a fair size`, b.l >= 0 && b.r <= b.W + 0.5 && b.sw <= b.W && b.cw >= 140 && b.ch >= 90, JSON.stringify(b));
  }
  // a new race: the stored best lap is there from the start
  await page.setViewportSize({ width: 640, height: 360 });
  await startTrack(page, ID);
  const again = await page.evaluate(() => { const A = window.__game.analiza; return { ref: !!(A && A.ref), lt: A && A.ref ? +A.ref.lt.toFixed(2) : 0, n: A ? A.list.length : -1, off: document.getElementById('res-an').classList.contains('off') }; });
  T.check('the next race starts with the stored best lap', again.ref && again.lt > 0 && again.n === 0 && again.off, JSON.stringify(again));
  T.check('no errors', errors.length === 0, errors.slice(0, 3).join(' | '));
} catch (e) {
  T.check('ran', false, e.stack || String(e));
} finally {
  await browser.close(); srv.close();
}
T.done();
