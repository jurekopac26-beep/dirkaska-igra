// Kontrole (Nastavitve · Kontrole): the keys for each action set by the player (a key pressed for the box; Esc keeps it, Backspace clears
// it; a key taken from the action it was on), kept and used in the race; Ponastavi: the defaults. A pad (the standard layout, stood in for
// by a script): its buttons shown and set by pressing them, the race honouring them. A wheel with pedals (another layout, its pedals read
// 0 until they first move): its steering axis found by turning it right (turned the other way: inverted), each pedal by pressing it down
// and letting it go (where it rests and where it is pressed down measured), the dead zone and the share of the axis for full lock; the
// race driven with them. In English.
//   node tests/browser/ctrl.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('controls: keys, gamepad, wheel');
const srv = await serve();
const browser = await launch();
// the devices: a pad in the standard layout and a wheel with pedals (a script's; window.__devs: those connected)
const init = () => {
  const btns = (n) => Array.from({ length: n }, () => ({ pressed: false, touched: false, value: 0 }));
  window.__pad = { id: 'Test pad (STANDARD GAMEPAD)', index: 0, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0], buttons: btns(17) };
  window.__wheel = { id: 'G29 Driving Force Racing Wheel (Vendor: 046d Product: c24f)', index: 1, connected: true, mapping: '', timestamp: 0, axes: [0, 0, 0, 0, 0, 0], buttons: btns(25) };
  window.__devs = [];
  Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [window.__devs[0] || null, window.__devs[1] || null, null, null] });
  window.__btn = (d, i, v) => { const b = d.buttons[i]; b.pressed = v > 0.5; b.value = v; };
};
const frames = (page, n = 2) => page.evaluate((n) => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', track: 'jezero' }, { width: 844, height: 390 }, { init });
  const act = (a, sel) => page.evaluate(([a, sel]) => { const el = sel ? document.querySelector(sel) : null; window.__game.onAction(a, el); }, [a, sel || null]);
  const key = (code, k) => page.evaluate(([code, k]) => { window.dispatchEvent(new KeyboardEvent('keydown', { code, key: k || '' })); window.dispatchEvent(new KeyboardEvent('keyup', { code, key: k || '' })); }, [code, k]);
  const rows = () => page.evaluate(() => [...document.querySelectorAll('#ctrl-body .ctl-row')].map(r => r.innerText.replace(/\s+/g, ' ').trim()));
  const slot = (kind, a, i) => `#ctrl-body [data-act="${kind}"][data-a="${a}"][data-i="${i}"]`;
  const click = (sel) => page.evaluate((sel) => document.querySelector(sel).click(), sel);

  // 1. the keys: the defaults
  await page.evaluate(() => { const g = window.__game; g.onAction('to-settings'); });
  await click('[data-act="to-ctrl"]');
  const k0 = await rows();
  T.check('Kontrole (no pad connected: the keyboard): the default keys, two for each action', k0.join(' | ') === 'Levo ← A | Desno → D | Plin ↑ W | Zavora ↓ S | Drift Preslednica — | Pavza Esc P | Kamera C — | Gume za postanek T —', k0.join(' | '));

  // 2. set: Plin's second key I; Levo's second J; Esc keeps a box as it was, Backspace clears it; a key taken from the action it was on
  await click(slot('ctl-key', 'gas', 1)); const w1 = await page.evaluate((s) => document.querySelector(s).textContent, slot('ctl-key', 'gas', 1));
  await key('KeyI', 'i');
  await click(slot('ctl-key', 'left', 1)); await key('KeyJ', 'j');
  await click(slot('ctl-key', 'pause', 1)); await key('Escape');
  await click(slot('ctl-key', 'drift', 0)); await key('Backspace');
  await click(slot('ctl-key', 'drift', 1)); await key('KeyN', 'n');
  await click(slot('ctl-key', 'cam', 1)); await key('KeyD', 'd');   // (D taken from Desno)
  const k1 = await rows(), st1 = await page.evaluate(() => JSON.parse(localStorage.getItem('tdgp-ctrl')).keys);
  T.check('a box waits for a key ("Pritisni tipko …"); I for Plin, J for Levo; Esc: Pavza kept; Backspace: Drift\'s first none, N its second; D taken from Desno for Kamera; kept',
    w1 === 'Pritisni tipko …' && k1.join(' | ') === 'Levo ← J | Desno → — | Plin ↑ I | Zavora ↓ S | Drift — N | Pavza Esc P | Kamera C D | Gume za postanek T —' && st1.gas[1] === 'KeyI' && st1.drift.join() === ',KeyN',
    JSON.stringify({ w1, k1, st1 }));

  // 3. the race with them: I the throttle (W no more), J left, N drift, D the camera
  await act('ctrl-done'); await act('settings-done');
  await startTrack(page, 'jezero');
  await page.evaluate(() => { const g = window.__game; g.sim(9, false); });   // (past the lights)
  const drive = (codes) => page.evaluate(async (codes) => { for (const c of codes) window.dispatchEvent(new KeyboardEvent('keydown', { code: c }));
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); const s = Object.assign({}, Input.state); for (const c of codes) window.dispatchEvent(new KeyboardEvent('keyup', { code: c })); return s; }, codes);
  const d1 = await drive(['KeyI']), d2 = await drive(['KeyW']), d3 = await drive(['KeyJ', 'KeyN']), d4 = await drive(['KeyA']);
  const cam0 = await page.evaluate(() => window.__game.S.camera); await key('KeyD'); const cam1 = await page.evaluate(() => window.__game.S.camera);
  T.check('in the race: I the throttle (W no more), J left with N drift (A no more), D the camera', d1.thr === 1 && d2.thr === 0 && d3.steer === -1 && d3.hand === 1 && d4.steer === 0 && cam1 !== cam0, JSON.stringify({ d1, d2, d3, d4, cam0, cam1 }));

  // 4. Ponastavi: the default keys again
  await page.evaluate(() => { const g = window.__game; g.onAction('to-title'); g.onAction('to-settings'); });
  await click('[data-act="to-ctrl"]'); await act('ctrl-reset');
  const k2 = await rows();
  T.check('Ponastavi: the default keys', k2.join(' | ') === k0.join(' | '), k2.join(' | '));

  // 5. a pad: the Kontrole page for it (its buttons in the standard layout); Drift's first set to LB by pressing it; the race honours it
  await page.evaluate(() => { window.__devs = [window.__pad]; });
  await act('ctrl-tab', '#ctrl-tabs [data-v="pad"]'); await frames(page, 3);
  const p0 = await rows();
  await click(slot('ctl-pad', 'drift', 0));
  const pw = await page.evaluate((s) => document.querySelector(s).textContent, slot('ctl-pad', 'drift', 0));
  await page.evaluate(() => window.__btn(window.__pad, 4, 1)); await frames(page, 3); await page.evaluate(() => window.__btn(window.__pad, 4, 0)); await frames(page, 2);
  const p1 = await rows(), sp = await page.evaluate(() => JSON.parse(localStorage.getItem('tdgp-ctrl')).pads['Test pad (STANDARD GAMEPAD)'].drift);
  T.check('a pad: "Plošček", the steering on axis 0, its buttons (Plin RT and A: 7, 0 ...); Drift\'s first set by pressing LB (button 4), kept',
    /^Plošček Test pad/.test(p0[0]) && p0[1].startsWith('Krmiljenje Os 0') && p0.includes('Plin Gumb 7 Gumb 0') && p0.includes('Zavora Gumb 6 Gumb 2') && p0.includes('Drift Gumb 1 Gumb 5') && pw === 'Pritisni gumb …' && p1.includes('Drift Gumb 4 Gumb 5') && JSON.stringify(sp) === '[{"t":"b","i":4},{"t":"b","i":5}]',
    JSON.stringify({ p0, pw, p1, sp }));
  await act('ctrl-done'); await act('settings-done');
  await startTrack(page, 'jezero');
  await page.evaluate(() => { window.__game.sim(9, false); });
  const padSt = (b) => page.evaluate(async (b) => { window.__btn(window.__pad, b, 1); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); const s = Object.assign({}, Input.state); window.__btn(window.__pad, b, 0); await new Promise(r => requestAnimationFrame(r)); return s; }, b);
  const q1 = await padSt(4), q2 = await padSt(1), q3 = await padSt(7);
  T.check('in the race: LB drift, B no more; RT the throttle', q1.hand === 1 && q2.hand === 0 && q3.thr === 1, JSON.stringify({ q1, q2, q3 }));

  // 6. a wheel with pedals: the note; Kontrole: "Volan", its name; the steering found by turning it right (this one reads right as -: inverted)
  await page.evaluate(() => { const g = window.__game; g.onAction('to-title'); window.__devs = [window.__wheel]; });
  await page.evaluate(() => { window.__btn(window.__wheel, 0, 1); }); await frames(page, 3); await page.evaluate(() => { window.__btn(window.__wheel, 0, 0); }); await frames(page, 2);
  const note = await page.evaluate(() => document.getElementById('toast').textContent);
  await page.evaluate(() => { const g = window.__game; g.onAction('to-title'); g.onAction('to-settings'); });
  await click('[data-act="to-ctrl"]'); await frames(page, 3);
  const w0 = await rows();
  await click(slot('ctl-pad', 'steer', 0)); const ws = await page.evaluate((s) => document.querySelector(s).textContent, slot('ctl-pad', 'steer', 0));
  await page.evaluate(() => { window.__wheel.axes[0] = -0.6; }); await frames(page, 3); await page.evaluate(() => { window.__wheel.axes[0] = 0; }); await frames(page, 2);
  const w1r = await rows();
  T.check('a wheel: the note to set its pedals; Kontrole: "Volan G29 Driving Force Racing Wheel", no pedals yet; the steering found by turning right (axis 0, read as -: turned the other way)',
    /Volan je povezan\. Pedale nastaviš v Nastavitvah: Kontrole\./.test(note) && w0[0] === 'Volan G29 Driving Force Racing Wheel' && w0.includes('Plin — —') && w0.includes('Zavora — —') && ws === 'Zavrti v desno …' && w1r[1].startsWith('Krmiljenje Os 0 ⇄'),
    JSON.stringify({ note, w0, ws, w1r }));

  // 7. the pedals: each pressed down and let go (it read 0 before: where it rests is measured once let go): Plin axis 2, Zavora axis 3
  const pedal = async (a, ax) => { await click(slot('ctl-pad', a, 0)); await page.evaluate((ax) => { window.__wheel.axes[ax] = -1; }, ax); await frames(page, 4);
    await page.evaluate((ax) => { window.__wheel.axes[ax] = 1; }, ax); await page.waitForTimeout(700); await frames(page, 3); };
  await pedal('gas', 2); await pedal('brake', 3);
  const w2 = await rows(), sw = await page.evaluate(() => JSON.parse(localStorage.getItem('tdgp-ctrl')).pads[window.__wheel.id]);
  const half = await page.evaluate(async () => { window.__wheel.axes[2] = 0; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); const v = { thr: Input.pad.thr, brk: Input.pad.brk, bar: document.getElementById('ctl-v-gas').style.width }; window.__wheel.axes[2] = 1; return v; });
  T.check('the pedals: Plin axis 2, Zavora axis 3 (rest at 1, pressed down at -1: "Os 2 −"); half way down: half the throttle (the bar too), the brake let be',
    w2.some(t => /^Plin Os 2 − —/.test(t)) && w2.some(t => /^Zavora Os 3 − —/.test(t)) && JSON.stringify(sw.gas) === '[{"t":"a","i":2,"lo":1,"hi":-1}]' && JSON.stringify(sw.brake) === '[{"t":"a","i":3,"lo":1,"hi":-1}]' &&
      half.thr > 0.4 && half.thr < 0.55 && half.brk === 0 && parseFloat(half.bar) > 40, JSON.stringify({ w2, sw, half }));

  // 8. the dead zone and the share of the axis for full lock: 5 %, 50 %: a quarter turn right (read -0.25) steers 0.47
  await page.evaluate(() => { const set = (id, v) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }; set('ctl-dz', 5); set('ctl-rng', 50); });
  const cal = await page.evaluate(async () => { window.__wheel.axes[0] = -0.25; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); const v = Input.pad.steer; window.__wheel.axes[0] = 0; return { v, dz: document.getElementById('ctl-dz-v').textContent, rng: document.getElementById('ctl-rng-v').textContent }; });
  T.check('Mrtvo območje 5 %, Poln zavoj pri 50 % osi: a quarter turn right steers 0.47', Math.abs(cal.v - 0.4737) < 0.01 && cal.dz === '5 %' && cal.rng === '50 % osi', JSON.stringify(cal));

  // 9. the race on the wheel: the throttle pedal down, the wheel a little right: the car goes, steering in proportion
  await act('ctrl-done'); await act('settings-done');
  await startTrack(page, 'jezero');
  await page.waitForFunction(() => window.__game.phase === 'racing', null, { timeout: 60000 });   // (the car still on the grid: the pedal starts it)
  const wr = await page.evaluate(async () => { window.__wheel.axes[2] = -1; window.__wheel.axes[0] = -0.1; const g = window.__game, P = g.race.player, v0 = P.speed;
    const t0 = g.race.time; for (let k = 0; k < 400 && g.race.time < t0 + 1.5; k++) await new Promise(r => setTimeout(r, 50));   // (1.5 s of the race: a software-drawn frame can be slow)
    const s = Object.assign({}, Input.state), v1 = P.speed; window.__wheel.axes[2] = 1; window.__wheel.axes[0] = 0; return { s, v0, v1 }; });
  T.check('the race on the wheel: the pedal down, the throttle full; the wheel a little right, steering in proportion (not full lock); the car goes',
    wr.s.thr === 1 && wr.s.brk === 0 && wr.s.steer > 0.1 && wr.s.steer < 0.25 && !wr.s.digital && wr.v1 > wr.v0 + 5, JSON.stringify(wr));

  // 10. in English: the page's names
  await page.evaluate(() => { const g = window.__game; g.onAction('to-title'); g.onAction('to-settings'); document.querySelector('[data-set="lang"] button[data-v="en"]').click(); });
  await click('[data-act="to-ctrl"]'); await act('ctrl-tab', '#ctrl-tabs [data-v="keys"]');
  const en = await page.evaluate(() => ({ h: document.querySelector('#s-ctrl h2').textContent, tabs: [...document.querySelectorAll('#ctrl-tabs button')].map(b => b.textContent), rows: [...document.querySelectorAll('#ctrl-body .ctl-row')].map(r => r.innerText.replace(/\s+/g, ' ').trim()).slice(4, 5) }));
  T.check('in English: Controls, Keyboard, Gamepad and wheel, "Drift Space —"', en.h === 'Controls' && en.tabs.join() === 'Keyboard,Gamepad and wheel' && en.rows[0] === 'Drift Space —', JSON.stringify(en));

  T.check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
} catch (e) {
  T.check('the test ran through', false, String(e && e.message || e).split('\n')[0]);
} finally {
  await browser.close(); await srv.close();
}
T.done();
