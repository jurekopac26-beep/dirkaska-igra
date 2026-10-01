// Fuel, the race's length and the endurance race in the game: the settings on the track menu (Dolžina dirke: kratka / običajna / dolga /
// vzdržljivostna; Gorivo) on the title's line; a race at Toskana with fuel: the gauge on the HUD (full, a tick at what it takes to the
// line), a long race: no tick at first (a stop needed), the warning on the lap it would not last another, the player driven into the pits
// (on autopilot): filled up (POLNO), the gauge full again. The endurance race (three times the laps): the afternoon turns to evening and to
// night with the leader's progress (VEČER, PADA NOČ, the floodlights on), the race to the line; the track's best race time kept only for
// a race of the usual length.
//   node tests/browser/fuel.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('fuel');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', track: 'toskana', fuel: 0, length: 'normal', weather: 'dry', tod: 'day' }, { width: 390, height: 844 });
  const click = (set, v) => page.evaluate(([set, v]) => document.querySelector(`[data-set="${set}"] button[data-v="${v}"]`).click(), [set, v]);
  const sub = () => page.evaluate(() => { window.__game.onAction('to-title'); return document.getElementById('title-sub').textContent; });
  // (every text set, from the records: a stretch simulated in one go gives a single callback, by then a later message may have replaced it)
  await page.evaluate(() => { window.__msgs = []; const log = (id) => new MutationObserver((recs) => { for (const r of recs) for (const n of r.addedNodes) { const t = n.textContent; if (t) window.__msgs.push(t); } }).observe(document.getElementById(id), { childList: true, subtree: true }); log('h-msg'); log('toast'); });
  const frames = (n) => page.evaluate((n) => new Promise(res => { let k = 0; const f = () => (++k >= n ? res() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);

  // 1. the settings on the title's line
  const t0 = await sub();
  await click('fuel', '1'); const t1 = await sub();
  await click('length', 'short'); const t2 = await sub();
  await click('length', 'long'); const t3 = await sub();
  await click('length', 'endurance'); const t4 = await sub();
  T.check('the settings: fuel and the race\'s length on the title (3 laps; with fuel; 2, 6, 9 laps, endurance)', /· 3 krogi ·/.test(t0) && !/gorivo/.test(t0) && / · gorivo$/.test(t1) && /· 2 kroga ·/.test(t2) && /· 6 krogov ·/.test(t3) && /· 9 krogov · .* · vzdržljivostna · gorivo$/.test(t4), JSON.stringify([t0, t1, t2, t3, t4]));

  // 2. a race of the usual length with fuel: the gauge full, the tick at what it takes to the line
  await click('length', 'normal');
  await startTrack(page, 'toskana');
  await page.evaluate(() => { const g = window.__game; g.pause(); g.sim(12, true); g.resume(); }); await frames(3);
  const f1 = await page.evaluate(() => { const E = document.getElementById('h-fuel'), b = E.querySelector('b'), P = window.__game.race.player;
    return { shown: getComputedStyle(E).display !== 'none', text: E.textContent, tick: b ? parseFloat(b.style.left) : null, fuel: P.fuel, laps: window.__game.race.laps, tank: P.tankKg }; });
  T.check('a race with fuel: the gauge on the HUD (GORIVO 9x %), a tick at what it takes to the line (about three quarters of the tank)', f1.shown && /^GORIVO 9\d%$/.test(f1.text) && f1.tick > 55 && f1.tick < 90 && f1.laps === 3 && f1.tank > 0, JSON.stringify(f1));

  // 3. a long race: no tick at first (it will not reach the line on one tank); the warning; in the pits (on autopilot): filled up
  await page.evaluate(() => window.__game.onAction('to-title')); await click('length', 'long');
  await startTrack(page, 'toskana');
  await page.evaluate(() => { const g = window.__game; g.pause(); g.sim(12, true); g.resume(); }); await frames(3);
  const f2 = await page.evaluate(() => ({ laps: window.__game.race.laps, tick: !!document.querySelector('#h-fuel b') }));
  const w = await page.evaluate(async () => { const g = window.__game, P = g.race.player; g.pause();
    for (let k = 0; k < 60 && !window.__msgs.some(m => /Malo goriva/.test(m)); k++) { g.sim(4, true); g.resume(); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); g.pause(); }
    return { fuel: P.fuel, lap: P.lap, warned: window.__msgs.some(m => /Malo goriva/.test(m)) }; });
  const pit = await page.evaluate(async () => { const g = window.__game, P = g.race.player; let done = false, low = 1;
    for (let k = 0; k < 2400 && !done; k++) { P.pitWant = true; g.sim(0.25, true); low = Math.min(low, P.fuel); done = P.fuel > 0.99 && !P.inPit && low < 0.5; }
    P.pitWant = false; g.resume(); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r)))); g.pause();
    return { done, fuel: P.fuel, low, gauge: document.getElementById('h-fuel').textContent, msg: window.__msgs.filter(m => /POLNO/.test(m)) }; });
  T.check('a long race (6 laps): no tick at first; the warning on the lap it would not last another (Malo goriva)', f2.laps === 6 && !f2.tick && w.warned && w.fuel > 0.05 && w.fuel < 0.45, JSON.stringify({ f2, w }));
  T.check('in the pits: filled up (new slicks · POLNO), the gauge full again', pit.done && pit.fuel > 0.99 && /^GORIVO 100%/.test(pit.gauge) && pit.msg.some(m => /(SUHE|MEHKE|SREDNJE|TRDE) GUME( · POPRAVLJENO)? · POLNO/.test(m)), JSON.stringify(pit));
  await page.evaluate(() => { const g = window.__game; g.resume(); g.onAction('to-title'); });

  // 4. the endurance race: from the afternoon into the night with the leader's progress; to the line
  await click('fuel', '0'); await click('length', 'endurance');
  const rec0 = await page.evaluate(() => { const r = JSON.parse(localStorage.getItem('tdgp-records') || '{}'); return (r.tracks || {})['toskana@cs'] || null; });
  await startTrack(page, 'toskana');
  const e = await page.evaluate(async () => { const g = window.__game, out = []; window.__msgs.length = 0; g.pause();
    for (let k = 0; k < 400; k++) { g.sim(10, true); if (g.phase === 'done') break;   // (the results up: no resume, it would close them)
      g.resume(); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); g.pause();
      const L = g.race.order[0]; out.push({ p: +(L.dist / (g.race.laps * g.race.track.len)).toFixed(3), k: Render.show.todK, flood: Render.show.flood }); }
    if (g.phase !== 'done') g.resume(); return { laps: g.race.laps, endu: g.race.endu, out, msgs: window.__msgs.slice() }; });
  await page.waitForFunction(() => window.__game.screen === 'results', null, { timeout: 180000 });
  const o = e.out, at = (p) => o.find(x => x.p >= p) || o[o.length - 1];
  T.check('the endurance race: 9 laps; the light from the afternoon (0) to the night (1 at nine tenths of the race), step by step', e.laps === 9 && e.endu && o[0].k < 0.1 && o.every((x, i) => !i || x.k >= o[i - 1].k - 1e-6) && Math.abs(at(0.5).k - 0.56) < 0.08 && at(0.92).k === 1 && o[o.length - 1].k === 1,
    JSON.stringify(o.filter((x, i) => i % 4 === 0)));
  T.check('the evening and the night told (VEČER, PADA NOČ), the floodlights on at night and not in the afternoon', e.msgs.includes('VEČER') && e.msgs.includes('PADA NOČ') && e.msgs.indexOf('VEČER') < e.msgs.indexOf('PADA NOČ') && !o[0].flood && o[o.length - 1].flood, JSON.stringify(e.msgs));
  const rec1 = await page.evaluate(() => (JSON.parse(localStorage.getItem('tdgp-records') || '{}').tracks || {})['toskana@cs'] || null);
  T.check('to the line: the lap record counts, the best race time and place only for a race of the usual length', rec1 && rec1.bestLap > 0 && (rec0 ? rec1.bestRace === rec0.bestRace : !rec1.bestRace) && (rec0 ? rec1.bestPos === rec0.bestPos : !rec1.bestPos), JSON.stringify({ rec0, rec1 }));

  // 5. the title after it: the usual light again (the chosen time of day)
  await page.evaluate(() => window.__game.onAction('to-title')); await frames(3);
  const k5 = await page.evaluate(() => Render.show.todK);
  T.check('back on the title: the chosen time of day again (day)', k5 === 0, String(k5));

  T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
