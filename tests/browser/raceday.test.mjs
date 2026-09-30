// A race day on screen: the settings rows (weather "Spremenljivo", the tyres, the safety car), the player's tyres on the HUD,
// the weather changing during a race (the rain comes: the news, the streaks, the road wet; the rain stops: the racing line dries
// first, drawn lighter), the safety car (out after a crash: the banner, its car on the track with the light bar; in again and the
// race green), and the highlights after the race (Posnetek: the start first, the finish last, TV cameras by the track, the caption;
// back to the results with every car where it was).
//   node tests/browser/raceday.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('raceday');
const srv = await serve();
const browser = await launch();
const wait = (ms) => new Promise(r => setTimeout(r, ms));
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase', weather: 'mix', tyre: 'S', sc: 1 }, { width: 412, height: 915 }, { seed: 5 });
  const segs = (k) => page.evaluate((k) => [...document.querySelectorAll(`[data-set="${k}"] button`)].map(b => b.textContent + (b.classList.contains('sel') ? '*' : '')).join(' | '), k);
  const rows = { weather: await segs('weather'), tyre: await segs('tyre'), sc: await segs('sc') };
  T.check('settings: weather with Spremenljivo (selected), the tyres (Mehke selected), the safety car on',
    rows.weather === 'Suho | Dež | Spremenljivo* | Naključno' && rows.tyre === 'Samodejno | Mehke* | Srednje | Trde | Za dež' && rows.sc === 'Izklop | Vklop*', JSON.stringify(rows));

  // real frames of the game for a moment (the HUD, the drawing), the player's car on autopilot
  const frames = async (ms) => {   // (at least a few frames drawn, however slow the first ones are)
    const f0 = await page.evaluate(() => { const g = window.__game; g.autoDrive = true; g.resume(); return Render.info().render.frame; });
    await page.waitForFunction((f0) => Render.info().render.frame >= f0 + 6, f0, { timeout: 120000 }); await wait(ms); await page.evaluate(() => window.__game.pause()); };
  const sim = (sec) => page.evaluate(async (sec) => { const g = window.__game; for (let i = 0; i < sec && g.phase !== 'done'; i++) { g.sim(1, true); if (i % 10 === 0) await new Promise(r => setTimeout(r, 0)); } }, sec);
  const hideScreens = () => page.evaluate(() => { const st = document.createElement('style'); st.textContent = '.screen.show { display: none !important; }'; document.head.appendChild(st); });
  // a race whose weather turns the wanted way (to 1: the rain comes; 0: it stops), at 2 % of the distance
  const wxRace = async (to) => { for (let k = 0; k < 16; k++) { const w = await page.evaluate(() => { const g = window.__game; g.onAction('restart'); g.pause(); const W = g.race.wx; return W && W.to; }); if (w === to) break; }
    return page.evaluate(() => { const R = window.__game.race; if (R.wx) R.wx.at = 0.02; return R.wx ? R.wx.to : null; }); };

  await startTrack(page, 'jezero');
  await hideScreens();
  const e0 = errors.length;
  // 1. the rain comes
  {
    const to = await wxRace(1);
    await sim(8); await frames(1500);
    const a = await page.evaluate(() => { const R = window.__game.race, P = R.player, el = document.getElementById('h-tyre'); return { to: R.wx.to, done: R.wx.done, tyre: P.tyre, soft: R.cars.every(c => c.isPlayer || ['S', 'M'].includes(c.tyre)), badge: el.className, ltr: document.getElementById('h-tyre-l').textContent, msg: document.getElementById('h-msg').textContent }; });
    T.check('tyres: the player on softs as chosen (the HUD badge M), the field on slicks for a short race', to === 1 && a.tyre === 'S' && a.soft && a.badge === 'show' && a.ltr === 'M', JSON.stringify(a));
    await sim(40); await frames(1500);
    const b = await page.evaluate(() => { const R = window.__game.race; return { done: R.wx.done, rain: R.rain, wet: +R.wetness.toFixed(2), drawn: Render.raining, road: Render.wetDrawn, grip: +R.player.wet.toFixed(3), wl: +R.player.wl.toFixed(2) }; });
    T.check('the rain comes during the race: raining (streaks drawn), the track wet (the road drawn wet), less grip on slicks',
      b.done && b.rain === 1 && b.wet > 0.6 && b.drawn && b.road.road > 0.5 && b.grip < 0.8 && b.wl > 0.6, JSON.stringify(b));
  }
  // 2. the rain stops: the racing line dries first
  {
    const to = await wxRace(0);
    const a0 = await page.evaluate(() => ({ rain: window.__game.race.rain, dl: Render.dryLine }));
    await sim(70); await frames(1500);
    const a = await page.evaluate(() => { const R = window.__game.race, T = R.track, P = R.player; return { to: R.wx.to, done: R.wx.done, rain: R.rain, wet: +R.wetness.toFixed(2), lineK: +R.lineK.toFixed(2), dl: Render.dryLine, drawn: Render.raining, wl: +P.wl.toFixed(2), wets: R.cars.filter(c => c.tyre === 'W').length }; });
    T.check('the rain stops: no more streaks, the track still wet, the racing line drier (drawn lighter over the wet road)',
      to === 0 && a0.rain === 1 && a.done && a.rain === 0 && !a.drawn && a.wet > 0.3 && a.lineK < 0.9 && a.dl && a.dl.visible && a.dl.gain > 0.01, JSON.stringify({ a0, a }));
  }
  // 3. the safety car
  {
    await page.evaluate(() => { const g = window.__game; g.onAction('restart'); g.pause(); });
    await sim(12);
    const a = await page.evaluate(() => { const R = window.__game.race; R._scIncident(); return R.sc.phase; });
    await sim(4); await frames(1500);
    const b = await page.evaluate(() => { const R = window.__game.race, el = document.getElementById('h-sc'); return { phase: R.sc.phase, on: R.sc.onTrack, banner: el.textContent, cls: el.className, shown: Render.scShown, lead: +(R.sc.d - R.order[0].dist).toFixed(0) }; });
    T.check('safety car out: the banner, its car drawn on the track ahead of the leader', a === 'on' && b.phase === 'on' && b.on && b.banner === 'VARNOSTNI AVTO' && b.cls === 'show' && b.shown && b.lead > 0, JSON.stringify({ a, b }));
    const seen = new Set();
    for (let k = 0; k < 120; k++) { const ph = await page.evaluate(() => { window.__game.sim(1, true); return window.__game.race.sc.phase; }); seen.add(ph); if (ph === 'off' && seen.size > 1) break; }
    await frames(1500);
    const c = await page.evaluate(() => { const R = window.__game.race, el = document.getElementById('h-sc'); return { phase: R.sc.phase, n: R.sc.n, on: R.sc.onTrack, banner: el.textContent, shown: Render.scShown }; });
    T.check('safety car in again (its last lap, then the restart), the race green: no banner, no car', seen.has('in') && seen.has('restart') && c.phase === 'off' && c.n === 1 && !c.on && c.banner === '' && !c.shown, [...seen].join('>') + ' ' + JSON.stringify(c));
  }
  // 4. to the finish; the highlights
  {
    await sim(600);
    await page.evaluate(() => { window.requestAnimationFrame = () => 0; });   // (the game's own frames stop: the replay is stepped here)
    await wait(300);
    const r = await page.evaluate(() => { const g = window.__game, R = g.race, P = R.player; return { phase: g.phase, screen: g.screen, btn: !document.getElementById('res-replay').classList.contains('off'), ev: g.rpEvents.length, P: [P.x, P.z, P.h] }; });
    T.check('results with the Posnetek button (overtakes noted during the race)', r.phase === 'done' && r.screen === 'results' && r.btn && r.ev > 0, JSON.stringify(r));
    await page.evaluate(() => window.__game.onAction('replay'));
    const clips = [];
    for (let k = 0; k < 600; k++) {
      const q = await page.evaluate(() => { const g = window.__game, q = g.replay; if (!q) return null; const o = { k: q.k, n: q.n, kind: q.clip.kind, cams: q.cams, cap: document.getElementById('rp-cap').textContent, bar: !document.getElementById('rp').classList.contains('off'), shot: document.getElementById('hud').classList.contains('shot'), screen: g.screen }; g.rpStep(0.4); return o; });
      if (!q) break;
      if (!clips.length || clips[clips.length - 1].k !== q.k) clips.push(q);
    }
    const after = await page.evaluate(() => { const g = window.__game, P = g.race.player; return { screen: g.screen, rp: !!g.replay, bar: !document.getElementById('rp').classList.contains('off'), P: [P.x, P.z, P.h] }; });
    const kinds = clips.map(c => c.kind).join(',');
    const mid = clips.slice(1, -1);
    T.check('the highlights: the start first, then the overtakes and crashes (in the order they happened), the finish last; every moment filmed (cameras, caption, no HUD)',
      clips.length >= 2 && clips.length === clips[0].n && clips[0].kind === 'start' && clips[clips.length - 1].kind === 'finish' && mid.every(c => c.kind === 'pass' || c.kind === 'crash') &&
      clips.every(c => c.cams >= 1 && c.bar && c.shot && c.screen === 'none' && c.cap.length > 3), kinds + ' ' + JSON.stringify(clips.map(c => c.cap)));
    T.check('after the highlights: the results again, every car where it was', after.screen === 'results' && !after.rp && !after.bar && after.P.every((v, i) => v === r.P[i]), JSON.stringify({ before: r.P, after }));
  }
  T.check('no page errors', errors.length === e0 && !errors.length, errors.slice(0, 5).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
