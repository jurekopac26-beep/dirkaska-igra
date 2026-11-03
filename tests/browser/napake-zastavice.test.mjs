// Orodje za napake · Zastavica med dirko (sklop 7 of docs/orodje-za-napake.md; js/napake.js): Bathurst at 25 s by the quick entry.
// The round yellow flag button left of the pause button (on its side and upright), clear of the touch controls and the map; its tap, the
// key F and the pad's Select each put a flag: only the race's time is kept, a toast says so and the race goes on; the button hides with
// the pause button (the pause, the replay). Posnetek do sem: Zastavice (3) and the flags on the timeline; Zastavice plays each flag from
// 2 s before it to 1 s after it, again and again; Naslednja / Prejšnja go round them; a moment kept at a flag stands for it (the count
// stays, a numbered flag for the ⚑); Cel posnetek and 5 s back: the whole race again. The tool's settings: Samo tipka (no button, F
// still works), Izklop (F nothing), the tool off (no Označi in the replay).
//   node tests/browser/napake-zastavice.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('napake-zastavice');
const srv = await serve();
const browser = await launch();
// the pad (as in pad.test.mjs): a press lasts one frame of the game; Select / Back is button 8
const init = () => {
  window.__pad = { id: 'Test pad (STANDARD GAMEPAD)', index: 0, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })) };
  Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [window.__pad, null, null, null] });
  window.__press = (i, k) => new Promise((res) => { const b = window.__pad.buttons[i]; b.pressed = true; b.value = 1; let n = 0;
    const check = () => { n++; if (typeof Input !== 'undefined' && Input.pad.prev[k]) { b.pressed = false; b.value = 0; requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(() => res(true), 50))); }
      else if (n > 600) { b.pressed = false; b.value = 0; res(false); } else requestAnimationFrame(check); };
    requestAnimationFrame(check); });
};
try {
  const { page: Q, errors } = await openGame(browser, srv.base + '/index.html?proga=bathurst&t=25', { quality: 'normal', shadows: 0, camera: 'chase', control: 'buttons' }, { width: 640, height: 360 }, { init });
  await Q.waitForFunction(() => window.__game.quick && window.__game.quick.done, null, { timeout: 240000, polling: 250 });
  const box = (sel) => Q.evaluate((sel) => { const e = document.querySelector(sel); if (!e || getComputedStyle(e).display === 'none' || getComputedStyle(e).visibility === 'hidden') return null; const b = e.getBoundingClientRect(); return b.width ? { x: b.left, y: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height } : null; }, sel);
  const rp = () => Q.evaluate(() => { const P = window.__game.replay; return P && { t: P.t, t0: P.t0, t1: P.t1, play: P.play, mode: P.mode }; });
  const clear = (a, b) => !(a.x < b.r && b.x < a.r && a.y < b.b && b.y < a.b);
  // the flag button against the touch controls, the map and the pause button
  const place = async () => { const f = await box('#nk-fl'), p = await box('#btn-pause'), m = await box('#h-map'), others = [];
    for (const s of ['#c-left', '#c-right', '#c-gas', '#c-brake', '#h-map']) { const b = await box(s); if (b) others.push([s, b]); }
    const W = await Q.evaluate(() => innerWidth), H = await Q.evaluate(() => innerHeight);
    return { f, p, m, ok: !!f && !!p && Math.abs(f.w - f.h) < 1 && f.w >= 40 && f.x >= 0 && f.r <= W && f.y >= 0 && f.b <= H && Math.abs(f.y - p.y) < 2 && f.r <= p.x && p.x - f.r < 16 && others.every(([, b]) => clear(f, b)),
      hit: others.filter(([, b]) => !clear(f, b)).map(([s]) => s) }; };

  // 1. on its side: the button left of the pause button, clear of the pedals, the arrows and the map
  await Q.evaluate(() => window.__game.resume()); await Q.waitForTimeout(300);
  const L1 = await place();
  T.check('on its side (640 × 360): the round flag button left of the pause button, inside the screen, clear of the touch controls and the map', L1.ok && !!L1.m, JSON.stringify(L1));

  // 2. its tap: a flag (the race's time only), a toast, the race goes on
  const t0 = await Q.evaluate(() => window.__game.race.time);
  await Q.click('#nk-fl'); await Q.waitForTimeout(250);
  const a1 = await Q.evaluate(() => ({ f: window.__game.recFlags, toast: document.getElementById('toast').textContent, paused: window.__game.paused, screen: window.__game.screen, t: window.__game.race.time }));
  T.check('the tap: a flag with only the race\'s time ({ t }), the toast "⚑ Zastavica 1 · 00:2x.x – dirka teče naprej", the race not paused',
    a1.f && a1.f.length === 1 && Object.keys(a1.f[0]).join() === 't' && a1.f[0].t >= t0 && /^⚑ Zastavica 1 · 00:2\d\.\d – dirka teče naprej$/.test(a1.toast) && !a1.paused && a1.screen === 'none', JSON.stringify(a1));
  // (the race's clock goes on: waited for, not a fixed time - a busy machine draws few frames)
  const t1 = await Q.waitForFunction((t) => window.__game.race.time > t && window.__game.race.time, a1.t, { timeout: 15000, polling: 50 }).then(h => h.jsonValue(), () => a1.t);
  T.check('the race went on after the tap', t1 > a1.t, JSON.stringify({ was: a1.t, now: t1 }));
  // the key F, then the pad's Select (a second apart)
  await Q.waitForFunction((t) => window.__game.race.time > t + 1, a1.t, { timeout: 30000, polling: 100 });
  await Q.keyboard.press('KeyF'); await Q.waitForTimeout(100);
  await Q.waitForFunction((t) => window.__game.race.time > t + 2, a1.t, { timeout: 30000, polling: 100 });
  const pressed = await Q.evaluate(() => window.__press(8, 'back'));
  const a2 = await Q.evaluate(() => ({ f: window.__game.recFlags, toast: document.getElementById('toast').textContent, paused: window.__game.paused }));
  T.check('the key F and the pad\'s Select: flags 2 and 3 (a second apart), the race not paused', pressed && a2.f.length === 3 && a2.f[1].t > a2.f[0].t + 0.9 && a2.f[2].t > a2.f[1].t + 0.9 && /^⚑ Zastavica 3 · /.test(a2.toast) && !a2.paused, JSON.stringify(a2));

  // 3. the pause: the flag button hidden with the pause button (and F there puts no flag)
  await Q.evaluate(() => window.__game.pause()); await Q.waitForTimeout(200);
  const hp = await box('#nk-fl'); await Q.keyboard.press('KeyF');
  const n3 = await Q.evaluate(() => window.__game.recFlags.length);
  T.check('the pause: no flag button; F there: no flag', !hp && n3 === 3, JSON.stringify({ hp, n3 }));

  // 4. Posnetek do sem: Zastavice (3), the flags on the timeline where they are, no flag button
  await Q.click('#pause-rp'); await Q.waitForTimeout(500);
  const r0 = await rp(), fl = await Q.evaluate(() => [...document.querySelectorAll('#rp-line .nk-flag')].map(f => ({ left: parseFloat(f.style.left), txt: f.textContent, race: f.classList.contains('dirka') })));
  const F = await Q.evaluate(() => window.__game.recFlags.map(f => f.t));
  const want = F.map(t => 100 * (t - r0.t0) / (r0.t1 - r0.t0));
  const zb = await Q.evaluate(() => ({ txt: document.getElementById('rp-flags').textContent, dis: document.getElementById('rp-flags').disabled }));
  T.check('Posnetek do sem: "Zastavice (3)" on; three orange ⚑ on the timeline where the flags are; no flag button', zb.txt === 'Zastavice (3)' && !zb.dis && fl.length === 3 && fl.every((f, k) => f.race && f.txt === '⚑' && Math.abs(f.left - want[k]) < 0.2) && !(await box('#nk-fl')),
    JSON.stringify({ zb, fl, want }));

  // 5. Zastavice: the first flag from 2 s before it, playing; the loop back from 1 s after it
  await Q.click('#rp-flags'); await Q.waitForTimeout(100);
  const z1 = await rp(), nav = await Q.evaluate(() => ({ on: !document.getElementById('rp-fnav').classList.contains('off'), i: document.getElementById('rp-zi').textContent }));
  T.check('"Zastavice": the first flag, from 2 s before it, playing; ◀ ⚑ 1/3 ▶ shown', z1.mode === 'flags' && z1.play && z1.t >= F[0] - 2 - 0.01 && z1.t < F[0] - 1 && nav.on && nav.i === '⚑ 1/3', JSON.stringify({ z1, nav, f: F[0] }));
  await Q.waitForFunction((f) => window.__game.replay.t >= f + 0.7, F[0], { timeout: 60000, polling: 50 });
  await Q.waitForFunction((f) => window.__game.replay.t < f, F[0], { timeout: 60000, polling: 50 });
  const z2 = await rp();
  T.check('past 1 s after the flag: back to 2 s before it, still playing (the moment again)', z2.mode === 'flags' && z2.play && z2.t >= F[0] - 2 - 0.01 && z2.t < F[0] - 1.2, JSON.stringify({ z2, f: F[0] }));
  await Q.click('[data-act="rp-znext"]'); const z3 = await rp(), i3 = await Q.evaluate(() => document.getElementById('rp-zi').textContent);
  await Q.click('[data-act="rp-zprev"]'); await Q.click('[data-act="rp-zprev"]'); const z4 = await rp(), i4 = await Q.evaluate(() => document.getElementById('rp-zi').textContent);
  T.check('Naslednja: the second flag (2/3); Prejšnja twice: round to the third (3/3)', Math.abs(z3.t - (F[1] - 2)) < 0.2 && i3 === '⚑ 2/3' && Math.abs(z4.t - (F[2] - 2)) < 0.2 && i4 === '⚑ 3/3', JSON.stringify({ z3, i3, z4, i4, F }));

  // 6. a moment kept at the third flag: it stands for it (Zastavice still 3; the third a numbered flag)
  await Q.waitForFunction((f) => window.__game.replay.t >= f - 0.3, F[2], { timeout: 60000, polling: 50 });
  await Q.click('#nk-on'); await Q.mouse.move(300, 150); await Q.mouse.down(); await Q.mouse.move(340, 180, { steps: 5 }); await Q.mouse.up();
  await Q.click('#nk-bar .nk-add'); await Q.waitForTimeout(300);
  const k1 = await Q.evaluate(() => ({ tocke: Napake.stanje.tocke, txt: document.getElementById('rp-flags').textContent, fl: [...document.querySelectorAll('#rp-line .nk-flag')].map(f => f.textContent) }));
  T.check('a moment kept at the third flag stands for it: "Zastavice (3)", the timeline ⚑ ⚑ 1', k1.txt === 'Zastavice (3)' && k1.tocke.length === 3 && k1.tocke[2].kind === 'zbirka' && k1.fl.join() === '⚑,⚑,1', JSON.stringify(k1));
  // Cel posnetek; 5 s back in Zastavice: the whole race
  await Q.click('#rp-flags'); await Q.click('[data-act="rp-b5"]'); const m1 = await rp();
  await Q.click('#rp-flags'); await Q.click('#rp-all'); const m2 = await rp(), nav2 = await Q.evaluate(() => document.getElementById('rp-fnav').classList.contains('off'));
  T.check('5 s back in Zastavice, and Cel posnetek: the whole race again (the flags\' arrows hidden)', m1.mode === 'all' && m2.mode === 'all' && nav2, JSON.stringify({ m1: m1.mode, m2: m2.mode, nav2 }));

  // 7. upright: the button left of the pause button, clear of the touch controls
  await Q.evaluate(() => window.__game.onAction('rp-race'));
  await Q.waitForFunction(() => !window.__game.paused && window.__game.rpCount === 0, null, { timeout: 90000, polling: 100 });
  await Q.setViewportSize({ width: 360, height: 640 }); await Q.waitForTimeout(400);
  const L2 = await place();
  T.check('upright (360 × 640): the flag button left of the pause button, inside the screen, clear of the touch controls and the map', L2.ok, JSON.stringify(L2));

  // 8. the tool's settings: Samo tipka (no button; F a flag), Izklop (F nothing), the tool off (no Označi)
  const set = (k, v) => Q.evaluate(([k, v]) => { localStorage.setItem('tdgp-napake', JSON.stringify(Object.assign(Napake.nast, { [k]: v }))); }, [k, v]);
  await Q.evaluate(() => { window.__game.pause(); window.__game.onAction('to-settings'); }); await Q.click('#nk-set-open'); await Q.waitForTimeout(200);
  await Q.click('#nk-set [data-k="flag"] [data-v="key"]'); await Q.click('#nk-set [data-nk-d="zapri"]');
  await Q.evaluate(() => { window.__game.onAction('settings-done'); }); await Q.waitForTimeout(100);
  const sv = await Q.evaluate(() => JSON.parse(localStorage.getItem('tdgp-napake')));
  if (await Q.evaluate(() => window.__game.screen) !== 'none') await Q.evaluate(() => window.__game.resume());
  await Q.waitForTimeout(300);
  const nb = await box('#nk-fl'), n8 = await Q.evaluate(() => window.__game.recFlags.length); await Q.keyboard.press('KeyF'); await Q.waitForTimeout(100);
  const n9 = await Q.evaluate(() => window.__game.recFlags.length);
  T.check('Nastavitve · Orodje za napake · Samo tipka: kept (tdgp-napake), no button in the race; F still a flag', sv.flag === 'key' && !nb && n9 === n8 + 1, JSON.stringify({ sv, nb, n8, n9 }));
  await Q.evaluate(() => { window.__game.pause(); window.__game.onAction('to-settings'); }); await Q.click('#nk-set-open');
  await Q.click('#nk-set [data-k="flag"] [data-v="off"]'); await Q.click('#nk-set [data-k="on"] [data-v="0"]'); await Q.click('#nk-set [data-nk-d="zapri"]');
  await Q.evaluate(() => { window.__game.onAction('settings-done'); if (window.__game.screen !== 'none') window.__game.resume(); }); await Q.waitForTimeout(300);
  await Q.keyboard.press('KeyF'); await Q.waitForTimeout(100);
  const n10 = await Q.evaluate(() => window.__game.recFlags.length);
  await Q.evaluate(() => window.__game.pause()); await Q.click('#pause-rp'); await Q.waitForTimeout(300);
  const on = await box('#nk-on');
  T.check('Izklop and the tool off: F puts no flag; no Označi in the replay', n10 === n9 && !on, JSON.stringify({ n10, on }));
  T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
  await Q.context().close();
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
