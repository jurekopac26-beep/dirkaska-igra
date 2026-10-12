// A gamepad (the browser's Gamepad API, a pad in the standard layout stood in for by a script): the note on its first press; the menus
// (Start presses a screen's main button, the stick or the d-pad moves the highlight to the nearest button that way, A presses it, B goes
// back); a race started from the pad on the track picked with it; driving (RT the throttle, the stick steering in proportion, the
// on-screen controls hidden); Start pauses, B carries on; a touch on the screen brings the on-screen controls back. No handbrake button on
// the screen (ROČNA) in any steering mode, upright or on its side: the brake and the gas side by side, as tall as each other, apart; a touch
// where ROČNA was brakes. No handbrake anywhere else either: no key for it (Space does nothing), no pad button (B and RB do nothing in a
// race), no 'hand' in the input, the player's car never has it on (P.inHand 0).
//   node tests/browser/pad.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('gamepad');
const srv = await serve();
const browser = await launch();
// the pad: its buttons and axes set by the test; a press lasts exactly one frame of the game (released right after the game's own
// polling has seen it: requestAnimationFrame callbacks run in the order they were asked for, so this one runs after the game's frame)
const init = () => {
  window.__pad = { id: 'Test pad (STANDARD GAMEPAD)', index: 0, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })) };
  Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [window.__pad, null, null, null] });
  const KEY = { 0: 'a', 1: 'b', 2: 'x', 3: 'y', 4: 'lb', 5: 'rb', 9: 'start', 12: 'up', 13: 'down', 14: 'left', 15: 'right' };
  window.__press = (i) => new Promise((res) => { const b = window.__pad.buttons[i], k = KEY[i]; b.pressed = true; b.value = 1; let n = 0;
    const check = () => { n++; if (typeof Input !== 'undefined' && Input.pad.prev[k]) { b.pressed = false; b.value = 0; requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(() => res(true), 50))); }
      else if (n > 600) { b.pressed = false; b.value = 0; res(false); } else requestAnimationFrame(check); };
    requestAnimationFrame(check); });
};
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'iso', track: 'rbring' }, { width: 844, height: 390 }, { init });
  const st = () => page.evaluate(() => { const f = document.querySelector('.pad-focus'); return { screen: window.__game.screen, focus: f ? (f.dataset.track || f.dataset.act || f.dataset.v || f.textContent.trim()) : '' }; });
  const press = async (i) => { const ok = await page.evaluate((i) => window.__press(i), i); const s = await st(); s.seen = ok; return s; };

  // 1. the first press: the note, the title's main button
  const s1 = await press(9);
  const note = await page.evaluate(() => document.getElementById('toast').textContent);
  T.check('first press: a note on the pad and its buttons; Start presses "Dirkaj" (the car screen, the highlight on "Naprej")', s1.seen && /Igralni plošček je povezan/.test(note) && s1.screen === 'car' && s1.focus === 'to-track', JSON.stringify(s1) + ' ' + note);
  // 2. the highlight moves the stick's or the d-pad's way; B goes back
  const s2 = await press(12);
  T.check('up: the highlight moves to a button above "Naprej"', s2.screen === 'car' && s2.focus !== 'to-track' && s2.focus !== '', JSON.stringify(s2));
  const s3 = await press(1);
  T.check('B: back to the title (the highlight on its main button)', s3.screen === 'title' && s3.focus === 'to-car', JSON.stringify(s3));
  // 3. the track screen: the highlight on the chosen track, left to the one before it, A picks it, Start starts the race there
  await press(9); const s4 = await press(9);
  T.check('Start twice: the track screen, the highlight on the chosen track', s4.screen === 'track' && s4.focus === 'rbring', JSON.stringify(s4));
  const prevId = await page.evaluate(() => { const c = [...document.querySelectorAll('[data-track]')], i = c.findIndex(e => e.dataset.track === 'rbring'); return c[i - 1].dataset.track; });
  const s5 = await press(14);
  const s6 = await press(0);
  const picked = await page.evaluate(() => window.__game.S.track);
  T.check('left: the track before it; A picks it', s5.focus === prevId && picked === prevId && s6.screen === 'track', JSON.stringify({ prevId, s5, picked }));
  await press(9);
  await page.waitForFunction((id) => { const g = window.__game; return g.race && g.race.track.def.id === id && g.phase === 'racing'; }, prevId, { timeout: 120000 });

  // 4. driving: RT the throttle, the stick steers in proportion, the on-screen controls hidden
  const d = await page.evaluate(async () => {
    const P = window.__game.race.player, pad = window.__pad; pad.buttons[7].value = 1; pad.buttons[7].pressed = true; pad.axes[0] = -0.8;
    // (1.2 s of race time, not 2.5 s of the clock: a software renderer (CI) draws a frame in ~0.4 s and the game steps at most 0.1 s a
    // frame; by then the car is well under way and not yet at the wall it steers into at ~2 s)
    const g = window.__game, t0 = g.race.time, w0 = performance.now();
    while (g.race.time - t0 < 1.2 && performance.now() - w0 < 60000) await new Promise(r => setTimeout(r, 50));
    const o = { v: P.speed, thr: P.inThr, steer: P.inSteer, digital: P.digitalSteer, hidden: document.getElementById('touch').classList.contains('pad') };
    pad.buttons[7].value = 0; pad.buttons[7].pressed = false; pad.axes[0] = 0; return o; });
  T.check('driving: RT full throttle, the stick 80 % left steers ~2/3 left (in proportion, not digital), the car moves; no on-screen controls', d.v > 3 && d.thr === 1 && d.steer < -0.6 && d.steer > -0.75 && !d.digital && d.hidden, JSON.stringify(d));

  // 5. Start pauses (the highlight on "Nadaljuj"), B carries on; a touch brings the on-screen controls back
  const s7 = await press(9);
  T.check('Start in a race: the pause, the highlight on "Nadaljuj"', s7.screen === 'pause' && s7.focus === 'resume', JSON.stringify(s7));
  const s8 = await press(1);
  T.check('B in the pause: back to the race', s8.screen === 'none', JSON.stringify(s8));
  const back = await page.evaluate(() => { const t = document.getElementById('touch'); t.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 5, clientX: 60, clientY: 300, bubbles: true })); t.dispatchEvent(new PointerEvent('pointerup', { pointerId: 5, clientX: 60, clientY: 300, bubbles: true })); return !t.classList.contains('pad'); });
  T.check('a touch on the screen: the on-screen controls again', back, '');
  T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
}
// (its own page and race, started without the pad: it runs whatever happened above)
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'iso', track: 'rbring' }, { width: 844, height: 390 }, { init });
  await startTrack(page, 'rbring');
  await page.evaluate(() => { const g = window.__game; for (let k = 0; k < 20 && g.phase !== 'racing'; k++) g.sim(2, true); g.sim(2, true); });   // (past the intro and the lights, on the autopilot)

  // 6. no handbrake button on the screen (ROČNA, HANDBRAKE): the touch controls in each steering mode, on its side and upright; a touch where it
  // was (above the brake) brakes, no handbrake; none on the keyboard (Space) or the pad (B, RB) either
  const modes = [];
  for (const vp of [{ width: 844, height: 390 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(vp);
    for (const m of ['buttons', 'wheel', 'tilt']) modes.push(await page.evaluate(async (m) => { Input.setMode(m); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); Input.layout();
      const T = document.getElementById('touch'), vis = [...T.querySelectorAll('.tb, #c-wheel, #tilt-ind')].filter(e => e.offsetParent !== null && getComputedStyle(e).visibility !== 'hidden');
      const rc = (id) => document.getElementById(id).getBoundingClientRect(), g = rc('c-gas'), b = rc('c-brake');
      const out = { m, w: innerWidth, ids: vis.map(e => e.id).join(), words: T.innerText.replace(/\s+/g, ' ').trim(), drift: !!document.getElementById('c-drift'), apart: b.right <= g.left || g.right <= b.left || b.bottom <= g.top, tall: m === 'tilt' || Math.abs(b.height - g.height) < 1 };
      if (m === 'buttons') { const x = b.left + b.width / 2, y = b.top - 20;   // (where ROČNA was: above the brake)
        T.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 7, clientX: x, clientY: y, bubbles: true })); const s = Input.update(0.016); out.above = { brk: s.brk, hand: 'hand' in s };
        T.dispatchEvent(new PointerEvent('pointerup', { pointerId: 7, clientX: x, clientY: y, bubbles: true })); Input.update(0.016); }
      return out; }, m));
  }
  await page.evaluate(() => Input.setMode(window.__game.S.control || 'buttons'));
  const exp = { buttons: 'c-left,c-right,c-brake,c-gas', wheel: 'c-wheel,c-brake,c-gas', tilt: 'c-brake,c-gas,tilt-ind' };
  T.check('no handbrake button on the screen (no ROČNA, no HANDBRAKE) in any steering mode, on its side and upright: the brake and the gas apart, as tall as each other (tilting: the brake on the left); a touch where ROČNA was brakes',
    modes.length === 6 && modes.every(o => !o.drift && o.ids === exp[o.m] && !/ROČNA|HANDBRAKE/.test(o.words) && o.apart && o.tall) && modes.filter(o => o.above).every(o => o.above.brk === 1 && o.above.hand === false), JSON.stringify(modes));
  // in the race (its own frames): Space held, then B, then RB on the pad: no 'hand' in the input, the player's car without the handbrake
  const hk = await page.evaluate(async () => {
    const g = window.__game, P = g.race.player, raf = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))), o = { phase: [], hand: [], inHand: [] };
    const look = () => { o.phase.push(g.phase); o.hand.push('hand' in Input.state || 'hand' in Input.pad); o.inHand.push(P.inHand); };
    o.keys = Object.keys(Input.keyMap).join(); o.padDef = Object.keys(Input.padRaw().def).join();
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' })); await raf(); look(); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' }));
    for (const i of [1, 5]) { const b = window.__pad.buttons[i]; b.pressed = true; b.value = 1; await raf(); look(); b.pressed = false; b.value = 0; await raf(); }
    o.screen = g.screen; return o; });
  T.check('no handbrake on the keyboard or the pad: no such action (the keys: left, right, gas, brake, pause, cam, tyre; the pad: steer, gas, brake, pause, cam, rescue); Space, B and RB in the race: no "hand" in the input, the player\'s car never on the handbrake (P.inHand 0), the race goes on',
    hk.keys === 'left,right,gas,brake,pause,cam,tyre' && hk.padDef === 'steer,gas,brake,pause,cam,rescue' && hk.hand.length === 3 && hk.hand.every(h => h === false) && hk.inHand.every(v => v === 0) && hk.phase.every(p => p === 'racing') && hk.screen === 'none', JSON.stringify(hk));
  T.check('no page errors (no handbrake)', errors.length === 0, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through (no handbrake)', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
