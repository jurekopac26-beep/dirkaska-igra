// Failures in the game (Nastavitve · Okvare, on by default; the Red Bull Ring, the player on autopilot): a cut tyre, hot brakes, a hot
// engine each as a pill under the speedometer, the moment one comes the message, the commentator and what to do about it (a toast: the pits
// change the tyre); the pit stop's new tyre takes its pill away. In English: PUNCTURE, HOT BRAKES, HOT ENGINE. Switched off: none.
//   node tests/browser/faults.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('failures');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', track: 'rbring', weather: 'dry', faults: 1, comm: 1 }, { width: 390, height: 844 }, { seed: 11 });
  await startTrack(page, 'rbring');
  // step the race (paused, on autopilot), then two drawn frames (the HUD follows the race only while it runs)
  const sim = (t) => page.evaluate((t) => new Promise(res => { const g = window.__game; g.pause(); g.sim(t, true); g.resume();
    requestAnimationFrame(() => requestAnimationFrame(() => { g.pause(); res(); })); }), t);
  // the HUD's messages and the commentator's lines as they come (the line in the middle is shared with the rivals' duels and mistakes)
  await page.evaluate(() => { window.__msgs = []; new MutationObserver((recs) => { for (const r of recs) for (const n of r.addedNodes) { const t = n.textContent; if (t) window.__msgs.push(t); } }).observe(document.getElementById('h-msg'), { childList: true, subtree: true });
    const C = window.__game.comm, o = C.say; window.__said = []; C.say = function (k) { window.__said.push(k); return o.apply(this, arguments); }; });
  const hud = () => page.evaluate(() => { const el = document.getElementById('h-flt'), P = window.__game.race.player;
    return { on: getComputedStyle(el).display !== 'none', pills: [...el.children].map(s => s.className + ':' + s.textContent), toast: document.getElementById('toast').textContent,
      msgs: window.__msgs.splice(0), said: window.__said.splice(0), flt: P.flt && { pw: P.flt.pw, pk: +P.flt.pk.toFixed(2), brT: Math.round(P.flt.brT), enT: Math.round(P.flt.enT) } }; });

  await sim(20);
  const h0 = await hud();
  T.check('a race with failures: every car with them, none yet (no pill)', !!h0.flt && h0.flt.pw === -1 && !h0.on && !h0.pills.length && await page.evaluate(() => window.__game.race.cars.every(c => !!c.flt)), JSON.stringify(h0));

  // 1. a cut tyre (front right): its pill, PREDRTA GUMA!, the commentator, the toast (the pits change it); it goes down
  await page.evaluate(() => { const F = window.__game.race.player.flt; F.pw = 1; F.pk = 0; F.ev = 'puncture'; });
  await sim(0.4);
  const h1 = await hud();
  T.check('a cut tyre: the pill PREDRTA GUMA, the message, the commentator, the toast (into the pits for a new one)',
    h1.on && h1.pills.join() === 'pk:PREDRTA GUMA' && h1.msgs.includes('PREDRTA GUMA!') && h1.said.includes('puncture') && /Zapelji v bokse, mehaniki jo zamenjajo/.test(h1.toast) && h1.flt.pw === 1 && h1.flt.pk > 0, JSON.stringify(h1));

  // 2. hot brakes and a hot engine (as after hard braking, as when it toils): their pills too, each told
  await page.evaluate(() => { const F = window.__game.race.player.flt; F.brT = 640; });
  await sim(0.2);
  const h2 = await hud();
  await page.evaluate(() => { const F = window.__game.race.player.flt; F.enT = 124; });
  await sim(0.2);
  const h3 = await hud();
  T.check('hot brakes, then a hot engine: their pills beside the tyre\'s, each told (ZAVORE SE PREGREVAJO, MOTOR SE PREGREVA)',
    h2.pills.join() === 'pk:PREDRTA GUMA,br:VROČE ZAVORE' && h2.msgs.includes('ZAVORE SE PREGREVAJO') && h2.said.includes('brakesHot') && /zaviraj prej/.test(h2.toast)
    && h3.pills.join() === 'pk:PREDRTA GUMA,br:VROČE ZAVORE,en:VROČ MOTOR' && h3.msgs.includes('MOTOR SE PREGREVA') && h3.said.includes('engineHot') && /popusti plin/.test(h3.toast), JSON.stringify({ h2, h3 }));

  // 3. in English
  const en = await page.evaluate(() => { const g = window.__game; g.onAction('to-settings'); document.querySelector('[data-set="lang"] button[data-v="en"]').click(); g.onAction('settings-done');
    return new Promise(res => { g.resume(); requestAnimationFrame(() => requestAnimationFrame(() => { g.pause(); const el = document.getElementById('h-flt'); const t = [...el.children].map(s => s.textContent).join();
      g.onAction('to-settings'); document.querySelector('[data-set="lang"] button[data-v="sl"]').click(); g.onAction('settings-done'); res(t); })); }); });
  T.check('in English: PUNCTURE, HOT BRAKES, HOT ENGINE', en === 'PUNCTURE,HOT BRAKES,HOT ENGINE', en);

  // 4. cooled down at speed and a new tyre from the pits: the pills go
  await page.evaluate(() => { const g = window.__game, P = g.race.player; P.flt.brT = 300; P.flt.enT = 90; g.race.repairCar(P); });
  await sim(0.4);
  const h4 = await hud();
  T.check('cooled down, a new tyre from the pits: no pill', !h4.on && !h4.pills.length && h4.flt.pw === -1, JSON.stringify(h4));

  // 5. switched off in the settings: the next race without failures
  await page.evaluate(() => { const g = window.__game; g.resume(); g.onAction('to-title'); g.onAction('to-settings'); document.querySelector('[data-set="faults"] button[data-v="0"]').click(); g.onAction('settings-done'); });
  await startTrack(page, 'rbring');
  await sim(5);
  const off = await page.evaluate(() => ({ flt: window.__game.race.cars.some(c => !!c.flt), on: getComputedStyle(document.getElementById('h-flt')).display !== 'none', stored: JSON.parse(localStorage.getItem('tdgp-settings')).faults }));
  T.check('switched off in the settings: no failures on any car, no pill (kept)', !off.flt && !off.on && off.stored === 0, JSON.stringify(off));
  T.check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
} catch (e) {
  T.check('the test ran through', false, String(e && e.message || e).split('\n')[0]);
} finally {
  await browser.close(); await srv.close();
}
T.done();
