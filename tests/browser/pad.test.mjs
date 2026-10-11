// A gamepad (the browser's Gamepad API, a pad in the standard layout stood in for by a script): the note on its first press; the menus
// (Start presses a screen's main button, the stick or the d-pad moves the highlight to the nearest button that way, A presses it, B goes
// back); a race started from the pad on the track picked with it; driving (RT the throttle, the stick steering in proportion, the
// on-screen controls hidden); Start pauses, B carries on; a touch on the screen brings the on-screen controls back. No handbrake button on
// the screen (ROČNA) in any steering mode, upright or on its side: the brake and the gas side by side, as tall as each other, apart; a touch
// where ROČNA was brakes; the handbrake on the keyboard (Space) and the pad (B) still.
//   node tests/browser/pad.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

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

  // 6. no handbrake button on the screen (ROČNA, HANDBRAKE): the touch controls in each steering mode, on its side and upright; a touch where it
  // was (above the brake) brakes, no handbrake; the handbrake on the keyboard and the pad
  const modes = [];
  for (const vp of [{ width: 844, height: 390 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(vp);
    for (const m of ['buttons', 'wheel', 'tilt']) modes.push(await page.evaluate(async (m) => { Input.setMode(m); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); Input.layout();
      const T = document.getElementById('touch'), vis = [...T.querySelectorAll('.tb, #c-wheel, #tilt-ind')].filter(e => e.offsetParent !== null && getComputedStyle(e).visibility !== 'hidden');
      const rc = (id) => document.getElementById(id).getBoundingClientRect(), g = rc('c-gas'), b = rc('c-brake');
      const out = { m, w: innerWidth, ids: vis.map(e => e.id).join(), words: T.innerText.replace(/\s+/g, ' ').trim(), drift: !!document.getElementById('c-drift'), apart: b.right <= g.left || g.right <= b.left || b.bottom <= g.top, tall: m === 'tilt' || Math.abs(b.height - g.height) < 1 };
      if (m === 'buttons') { const x = b.left + b.width / 2, y = b.top - 20;   // (where ROČNA was: above the brake)
        T.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 7, clientX: x, clientY: y, bubbles: true })); const s = Input.update(0.016); out.above = { brk: s.brk, hand: s.hand };
        T.dispatchEvent(new PointerEvent('pointerup', { pointerId: 7, clientX: x, clientY: y, bubbles: true })); Input.update(0.016); }
      return out; }, m));
  }
  await page.evaluate(() => Input.setMode(window.__game.S.control || 'buttons'));
  const exp = { buttons: 'c-left,c-right,c-brake,c-gas', wheel: 'c-wheel,c-brake,c-gas', tilt: 'c-brake,c-gas,tilt-ind' };
  T.check('no handbrake button on the screen (no ROČNA, no HANDBRAKE) in any steering mode, on its side and upright: the brake and the gas apart, as tall as each other (tilting: the brake on the left); a touch where ROČNA was brakes',
    modes.length === 6 && modes.every(o => !o.drift && o.ids === exp[o.m] && !/ROČNA|HANDBRAKE/.test(o.words) && o.apart && o.tall) && modes.filter(o => o.above).every(o => o.above.brk === 1 && o.above.hand === 0), JSON.stringify(modes));
  const hk = await page.evaluate(async () => { window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' })); const k = Input.update(0.016).hand; window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' }));
    const b = window.__pad.buttons[1]; b.pressed = true; b.value = 1; Input.padRead(0.016); Input.pad.on = true; const p = Input.update(0.016).hand; b.pressed = false; b.value = 0; Input.padRead(0.016); return { k, p, after: Input.update(0.016).hand }; });
  T.check('the handbrake: Space on the keyboard, B on the pad', hk.k === 1 && hk.p === 1 && hk.after === 0, JSON.stringify(hk));

  T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
