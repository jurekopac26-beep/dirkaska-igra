// Worn-out tyres in the game (Core.TYRE_CLIFF; the Red Bull Ring, mediums, the player on autopilot, the team radio on, failures off): worn
// past 75 % the message GUME IZRABLJENE (once a set), the commentator and what comes next (a toast: the cliff at 80 %, a burst past 100 %),
// the engineer's box call once the message has had its time; over the cliff the tyre pill red and blinking; past the set's burst point
// POČILA GUMA!, the commentator, the toast (into the pits), the pill POČENA GUMA with the failures' (they are off), the tyres at 0 % (never
// below); both messages with the warning icon; the pills on the screen upright and on its side; in English TYRES WORN, TYRE BURST!, BURST
// TYRE; a fresh set: no pill.
//   node tests/browser/wear.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('worn tyres');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', track: 'rbring', weather: 'dry', radio: 1, comm: 1, cmp: 'M' }, { width: 390, height: 844 }, { seed: 11 });
  await startTrack(page, 'rbring');
  // step the race (paused, on autopilot), then two drawn frames (the HUD follows the race only while it runs)
  const sim = (t) => page.evaluate((t) => new Promise(res => { const g = window.__game; g.pause(); g.sim(t, true); g.resume();
    requestAnimationFrame(() => requestAnimationFrame(() => { g.pause(); res(); })); }), t);
  // the HUD's messages (with their icon) and the commentator's lines as they come
  await page.evaluate(() => { window.__msgs = []; const M = document.getElementById('h-msg');
    new MutationObserver(() => { const t = M.textContent; if (t && window.__msgs[window.__msgs.length - 1] !== t) window.__msgs.push(t); }).observe(M, { childList: true, subtree: true, characterData: true });
    const C = window.__game.comm, o = C.say; window.__said = []; C.say = function (k) { window.__said.push(k); return o.apply(this, arguments); }; });
  const hud = () => page.evaluate(() => { const g = window.__game, P = g.race.player, ty = document.getElementById('h-tyre'), fl = document.getElementById('h-flt'), M = document.getElementById('h-msg');
    const box = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight; };
    return { tyre: ty.textContent, cls: ty.className, blink: getComputedStyle(ty).animationName, tyIn: box(ty), flt: [...fl.children].map(s => s.className + ':' + s.textContent), fltOn: getComputedStyle(fl).display !== 'none', fltIn: !fl.children.length || box(fl),
      msg: M.textContent, ic: M.dataset.ic || '', toast: document.getElementById('toast').textContent, msgs: window.__msgs.splice(0), said: window.__said.splice(0), radio: g.teamRadio.log.slice(),
      wear: +P.ty.wear.toFixed(3), bp: P.ty.bp, bw: P.ty.bw, flat: P.flat || 0, lap: P.lap }; });

  await sim(14);
  const h0 = await hud();
  T.check('fresh mediums: the pill SREDNJE with what is left, no warning, no burst', /^SREDNJE (99|100)%$/.test(h0.tyre) && !/worn|cliff/.test(h0.cls) && !h0.fltOn && h0.bw === -1 && !h0.msgs.some(m => /IZRABLJENE|POČILA/.test(m)), JSON.stringify(h0));

  // 1. worn past 75 %: the warning, once; the engineer's box call after it (not over it)
  await page.evaluate(() => { window.__game.race.player.ty.wear = 0.76; });
  await sim(0.3);
  const h1 = await hud();
  T.check('worn past 75 %: GUME IZRABLJENE (the warning icon), the commentator, the toast (the cliff at 80 %, a burst past 100 %: into the pits), the pill orange',
    h1.msgs[0] === 'GUME IZRABLJENE' && h1.msg === 'GUME IZRABLJENE' && h1.ic === 'warn' && h1.said.includes('tyresWorn') && /nad 80 % obrabe hitro izgubljajo oprijem, nad 100 % lahko guma poči\. Zapelji v bokse/.test(h1.toast) && /\bworn\b/.test(h1.cls) && !/cliff/.test(h1.cls) && h1.tyre === 'SREDNJE 24%' && !h1.radio.some(t => /izrabljene/.test(t)), JSON.stringify(h1));
  // (the message's time runs in drawn frames, at most 0.1 s each: on, a fifth of a second and two frames at a time, until the engineer speaks)
  let k = 0, h2 = null;
  for (; k < 80 && !(await page.evaluate(() => window.__game.teamRadio.log.some(t => /izrabljene/.test(t)))); k++) { await sim(0.2); const h = await hud(); h2 = h2 ? Object.assign(h, { msgs: h2.msgs.concat(h.msgs), said: h2.said.concat(h.said) }) : h; }
  if (!h2) h2 = await hud();
  const boxCall = h2.radio.find(t => /^Gume so izrabljene\. Boksi v tem krogu!/.test(t));
  T.check('... once it has had its time (2.4 s), the engineer: "Gume so izrabljene. Boksi v tem krogu!" (BOKSI V TEM KROGU); the warning not again',
    !!boxCall && k >= 8 && h2.msgs.includes('BOKSI V TEM KROGU') && !h2.msgs.includes('GUME IZRABLJENE') && !h2.said.includes('tyresWorn'), JSON.stringify({ msgs: h2.msgs, radio: h2.radio, said: h2.said, steps: k }));

  // 2. over the cliff: the pill red and blinking
  await page.evaluate(() => { window.__game.race.player.ty.wear = 0.9; });
  await sim(0.3);
  const h3 = await hud();
  T.check('over the cliff (90 %): the pill red and blinking, 10 % left', /\bcliff\b/.test(h3.cls) && h3.blink === 'fuelBlink' && h3.tyre === 'SREDNJE 10%' && h3.tyIn && !h3.msgs.some(m => /IZRABLJENE|POČILA/.test(m)), JSON.stringify(h3));

  // 3. past the set's burst point: the burst (failures off)
  await page.evaluate(() => { const P = window.__game.race.player; P.ty.wear = P.ty.bp - 0.0001; });
  let h4 = null; for (let k = 0; k < 10 && !(h4 && h4.bw >= 0); k++) { await sim(0.5); const h = await hud(); h4 = h4 ? Object.assign(h, { msgs: h4.msgs.concat(h.msgs), said: h4.said.concat(h.said) }) : h; }
  T.check('past its burst point: POČILA GUMA! (the warning icon), the commentator, the toast (into the pits), the pill POČENA GUMA (failures off), the tyres at 0 %, a wheel flat',
    h4.bw >= 0 && h4.flat === (1 << h4.bw) && h4.msgs.includes('POČILA GUMA!') && h4.msg === 'POČILA GUMA!' && h4.ic === 'warn' && h4.said.includes('tyreBurst') && /^Guma je počila: .*Zapelji v bokse/.test(h4.toast) && h4.flt.join() === 'pk:POČENA GUMA' && h4.fltOn && h4.fltIn && h4.tyre === 'SREDNJE 0%',
    JSON.stringify(h4));
  // on its side: the pills still on the screen
  await page.setViewportSize({ width: 844, height: 390 }); await sim(0.2);
  const h5 = await hud(); await page.setViewportSize({ width: 390, height: 844 }); await sim(0.2);
  T.check('on its side: the tyre pill and POČENA GUMA on the screen', h5.tyIn && h5.fltOn && h5.fltIn, JSON.stringify({ tyIn: h5.tyIn, fltIn: h5.fltIn }));

  // 4. in English (a fresh set first: no pill; then worn and burst again)
  const lang = (l) => page.evaluate((l) => { const g = window.__game; g.pause(); g.onAction('to-settings'); document.querySelector(`[data-set="lang"] button[data-v="${l}"]`).click(); g.onAction('settings-done'); }, l);
  await lang('en');
  await page.evaluate(() => { const P = window.__game.race.player; P.ty.wear = 0; P.ty.bw = -1; P.flat = 0; });
  await sim(0.3);
  const e0 = await hud();
  await page.evaluate(() => { window.__game.race.player.ty.wear = 0.76; });
  await sim(0.3);
  const e1 = await hud();
  await page.evaluate(() => { const P = window.__game.race.player; P.ty.wear = P.ty.bp - 0.0001; });
  let e2 = null; for (let k = 0; k < 10 && !(e2 && e2.bw >= 0); k++) { await sim(0.5); const h = await hud(); e2 = e2 ? Object.assign(h, { msgs: e2.msgs.concat(h.msgs) }) : h; }
  await lang('sl');
  T.check('a fresh set: no burst pill; in English: TYRES WORN, TYRE BURST!, the pill BURST TYRE, MEDIUM 0%',
    !e0.fltOn && !/worn|cliff/.test(e0.cls) && e1.msgs[0] === 'TYRES WORN' && /past 100 % a tyre can burst/.test(e1.toast) && e2.msgs.includes('TYRE BURST!') && e2.flt.join() === 'pk:BURST TYRE' && e2.tyre === 'MEDIUM 0%',
    JSON.stringify({ e0: { flt: e0.flt, cls: e0.cls }, e1: { msgs: e1.msgs, toast: e1.toast }, e2: { msgs: e2.msgs, flt: e2.flt, tyre: e2.tyre } }));
  T.check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
} catch (e) {
  T.check('the test ran through', false, String(e && e.message || e).split('\n')[0]);
} finally {
  await browser.close(); await srv.close();
}
T.done();
