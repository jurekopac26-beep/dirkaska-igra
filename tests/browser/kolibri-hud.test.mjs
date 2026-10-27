// The race screen with the KOLIBRI (the user's, approved on the mocks), on a phone upright (390 x 844) and on its side (640 x 360), and on a
// computer (1280 x 720): the timing tower at the top (one row of six: the first three, the one ahead, the player, the one behind, ⋯
// between those not in a row; everything else 32 px lower, nothing over the map or the buttons), the top left (21/22 as big, the
// total yellow, the speed under it; the line under the clock under that block; nothing under the clock until there is a time; no
// ZAVETRJE), the driving buttons (LEFT / RIGHT and BRAKE / GAS as pairs 3 px apart, as big as each other, the pedals' icons, a press that
// tips the pedal in without changing its colour), the KOLIBRI's tyre dots (each its own colour, one on fire, a wheel off: an empty ring)
// and ZAMENJAJ KOLO (round, over the car, its ring the time left; a tap, Enter, a pad's button), the settings (Poškodbe avtov Samo
// videz and Časovna tabela Zgoraj by default, Izklop · Zgoraj · Ob zemljevidu)
//   node tests/browser/kolibri-hud.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('KOLIBRI: tyres, ZAMENJAJ KOLO, the tower at the top, the driving buttons, the settings');
const srv = await serve(), browser = await launch();
const URL = srv.base + '/index.html?proga=bathurst&nacin=dirka&avto=kolibri&t=20';
const ov = (a, b) => a && b && a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;

async function screen(name, vp, touch) {
  const { page, errors, ctx } = await openGame(browser, URL, { tower: 1, control: 'buttons', quality: 'low', shadows: 0 }, vp, { touch });
  await page.waitForFunction(() => window.__game.quick && window.__game.quick.done, null, { timeout: 240000 });
  await page.evaluate(async () => { const g = window.__game; g.resume(); for (let i = 0; i < 3; i++) { g.sim(1, true); await new Promise(r => requestAnimationFrame(r)); } await new Promise(r => setTimeout(r, 400)); });
  const L = await page.evaluate(() => {
    const $ = (id) => document.getElementById(id), R = (id) => { const e = $(id); if (!e || !e.getClientRects().length) return null; const r = e.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
    const st = $('tw-strip'), cells = [...st.querySelectorAll('.c')], O = window.__game.race.order, P = window.__game.race.player, pi = O.indexOf(P);
    const fs = (id) => parseFloat(getComputedStyle($(id)).fontSize);
    return { strip: R('tw-strip'), cells: cells.map(c => +c.querySelector('b').textContent), me: cells.findIndex(c => c.classList.contains('me')), seps: st.querySelectorAll('.sep').length, pi,
      map: R('h-map'), pause: R('btn-pause'), rank: R('h-main'), pos: R('h-pos'), tot: R('h-tot'), spd: R('h-spd'), row2: R('h-row2'), times: R('h-times'), split: $('h-split') && getComputedStyle($('h-split')).marginTop,
      fPos: fs('h-pos'), fTot: fs('h-tot'), totCol: getComputedStyle($('h-tot')).color, tow: !!$('h-tow'), best: getComputedStyle($('h-best')).visibility,
      btn: ['c-left', 'c-right', 'c-brake', 'c-gas'].map(R), icons: ['c-brake', 'c-gas'].map(id => { const s = $(id).querySelector('svg'); return s ? s.getBoundingClientRect().width : 0; }),
      words: ['c-brake', 'c-gas'].map(id => $(id).textContent.trim()), oldTower: getComputedStyle($('h-tower')).display };
  });
  T.check(`${name}: the tower at the top, one row at the very top edge`, L.strip && L.strip.top <= 1 && Math.abs(L.strip.height - 32) < 1, JSON.stringify(L.strip));
  const want = new Set([0, 1, 2, L.pi - 1, L.pi, L.pi + 1].filter(i => i >= 0)); const got = new Set(L.cells.map(n => n - 1));
  T.check(`${name}: six drivers: the first three, the one ahead, you (yellow), the one behind; ⋯ between those not in a row`, L.cells.length === 6 && [...want].every(i => got.has(i)) && L.cells[L.me] === L.pi + 1 && L.seps === (L.pi > 4 ? 1 : 0), `${L.cells.join(' ')} you ${L.pi + 1}, ⋯ ${L.seps}`);
  T.check(`${name}: everything else under it (the top left, the clock, the map, the pause), the old tower not shown`, L.rank.top >= L.strip.bottom - 1 && L.times.top >= L.strip.bottom && L.map.top >= L.strip.bottom && L.pause.top >= L.strip.bottom && L.oldTower === 'none');
  T.check(`${name}: 21/22: the total as big as the place and yellow, the speed under them`, Math.abs(L.fPos - L.fTot) < 0.5 && /255, 210, 63/.test(L.totCol) && L.spd.top >= L.pos.bottom - 2 && Math.abs(L.pos.top - L.tot.top) < 2, `${L.fPos} / ${L.fTot}`);
  T.check(`${name}: no ZAVETRJE label; nothing under the clock before a time`, !L.tow && L.best === 'hidden');
  if (touch) {
    const [l, r, b, g] = L.btn;
    T.check(`${name}: LEFT / RIGHT and BRAKE / GAS: pairs 3 px apart, every button as big as the pedals`, Math.abs(r.left - l.right - 3) < 1 && Math.abs(g.left - b.right - 3) < 1 && [l, r, b].every(x => Math.abs(x.width - g.width) < 1 && Math.abs(x.height - g.height) < 1), L.btn.map(x => Math.round(x.width) + 'x' + Math.round(x.height)).join(' '));
    T.check(`${name}: the pedals' icons (58 px), no words on them`, L.icons.every(w => Math.abs(w - 58) < 1) && L.words.every(w => !w));
    T.check(`${name}: nothing over the map or the buttons (the tower, the top left)`, ![L.strip, L.rank].some(a => ov(a, L.map) || L.btn.some(x => ov(a, x))));
  }
  return { page, errors, ctx, L };
}

// 1. upright
{
  const { page, errors, ctx, L } = await screen('upright 390 x 844', { width: 390, height: 844 }, true);
  void L; T.check('upright: the line under the clock goes under the taller block at the left', await page.evaluate(() => { const s = document.getElementById('h-split'); s.textContent = 'KROG 1: 01:58.123'; s.className = 'show'; const a = s.getBoundingClientRect(), b = document.getElementById('h-row2').getBoundingClientRect(); s.className = ''; return a.top >= b.bottom - 1; }));
  // the pedal pressed: tipped in, its colour as it was
  const press = await page.evaluate(async () => { const e = document.getElementById('c-gas'), c0 = getComputedStyle(e).backgroundColor, b0 = getComputedStyle(e).borderColor; e.classList.add('on'); await new Promise(r => setTimeout(r, 200)); const cs = getComputedStyle(e), out = { t: cs.transform, c: cs.backgroundColor, b: cs.borderColor, c0, b0, d: cs.transitionDuration }; e.classList.remove('on'); out.d1 = getComputedStyle(e).transitionDuration; return out; });
  T.check('a pedal pressed: tipped in at its foot, sunk and smaller, its colour as it was (0.08 s down, 0.12 s up)', press.t !== 'none' && press.c === press.c0 && press.b === press.b0 && /0\.08s/.test(press.d) && /0\.12s/.test(press.d1), JSON.stringify(press));
  // the tyres: each dot its own colour; one on fire; ZAMENJAJ KOLO
  const dots = await page.evaluate(async () => { const g = window.__game, P = g.race.player; P.kt.w = [0, 0.24, 0.5, 0.9]; P.kt.d = [0, 0, 0, 0]; g.sim(0.05, true); await new Promise(r => requestAnimationFrame(r));
    return [...document.querySelectorAll('#h-tyre .dts i')].map(i => getComputedStyle(i).backgroundColor); });
  T.check('the KOLIBRI\'s dots: each tyre its own colour (new green, worn yellow to orange, never red from the wear alone)', /rgb\(4\d, 2\d\d, 4\d\)|rgb\(5\d, 2\d\d, 5\d\)/.test(dots[0]) && new Set(dots).size === 4 && !/rgb\(2[45]\d, [0-5]\d, /.test(dots[3]), dots.join(' | '));
  const sw = await page.evaluate(async () => { const g = window.__game, P = g.race.player; P.kt.d = [0.2, 1, 0, 0]; P.kt.hot = 1; g.sim(0.05, true); await new Promise(r => requestAnimationFrame(r));
    const hot = document.querySelectorAll('#h-tyre .dts i')[1].className; Core.applyDamage(P, 0.009, 0, 0.7); g.sim(0.3, true); await new Promise(r => requestAnimationFrame(r)); await new Promise(r => requestAnimationFrame(r));
    const W = document.getElementById('wheel-swap'), B = document.getElementById('ws-btn'), r = B.getBoundingClientRect(), m = document.getElementById('h-map').getBoundingClientRect(), lb = document.getElementById('ws-l').getBoundingClientRect();
    const ctl = ['c-left', 'c-right', 'c-brake', 'c-gas'].map(id => document.getElementById(id).getBoundingClientRect()), o = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    return { hot, miss: document.querySelectorAll('#h-tyre .dts i')[1].className, on: W.classList.contains('on') && W.classList.contains('round'), round: Math.abs(r.width - r.height) < 1, p: parseFloat(B.style.getPropertyValue('--p')), clear: !o(r, m) && !o(lb, m) && !ctl.some(c => o(r, c) || o(lb, c)), car: r.bottom < innerHeight * 0.6 }; });
  T.check('a tyre on fire: its dot light red, blinking; its wheel off at a real knock: an empty ring', sw.hot === 'hot' && sw.miss === 'miss', `${sw.hot} -> ${sw.miss}`);
  T.check('ZAMENJAJ KOLO: round, over the car, its ring the time left, clear of the map and the buttons', sw.on && sw.round && sw.p > 50 && sw.p < 100 && sw.clear && sw.car, JSON.stringify(sw));
  await page.screenshot({ path: 'test-results/kolibri-hud-upright.png' }).catch(() => {});
  const tap = await page.evaluate(async () => { const B = document.getElementById('ws-btn'); B.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); await new Promise(r => requestAnimationFrame(r)); const P = window.__game.race.player; return { wl: P.wreck.wl, on: document.getElementById('wheel-swap').classList.contains('on'), dot: document.querySelectorAll('#h-tyre .dts i')[1].className }; });
  T.check('a tap on it: the wheel on again at once, a new tyre (its dot not empty), the button gone', tap.wl === 0 && !tap.on && tap.dot === '', JSON.stringify(tap));
  T.check('upright: no page errors', !errors.length, errors.join(' | '));
  await ctx.close();
}
// 2. on its side
{
  const { page, errors, ctx } = await screen('on its side 640 x 360', { width: 640, height: 360 }, true);
  const sw = await page.evaluate(async () => { const g = window.__game, P = g.race.player; P.kt.d[2] = 1; P.kt.hot = 2; Core.applyDamage(P, 0.009, -1, 0); g.sim(0.2, true); await new Promise(r => requestAnimationFrame(r)); await new Promise(r => requestAnimationFrame(r));
    const r = document.getElementById('ws-btn').getBoundingClientRect(), lb = document.getElementById('ws-l').getBoundingClientRect(), o = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    const others = ['h-map', 'c-left', 'c-right', 'c-brake', 'c-gas', 'h-main', 'tw-strip', 'h-times'].map(id => document.getElementById(id).getBoundingClientRect());
    return { on: document.getElementById('wheel-swap').classList.contains('round'), clear: !others.some(e => o(r, e) || o(lb, e)), inside: lb.bottom < innerHeight }; });
  T.check('on its side: ZAMENJAJ KOLO on the wide screen, over nothing (the map, the buttons, the top left, the tower, the clock)', sw.on && sw.clear && sw.inside, JSON.stringify(sw));
  await page.screenshot({ path: 'test-results/kolibri-hud-side.png' }).catch(() => {});
  T.check('on its side: no page errors', !errors.length, errors.join(' | '));
  await ctx.close();
}
// 3. a computer: Enter changes the wheel; the tower in the middle
for (const vp of [{ width: 1280, height: 720 }, { width: 1920, height: 1080 }]) {
  const { page, errors, ctx, L } = await screen(`a computer ${vp.width} x ${vp.height}`, vp, false);
  const k = await page.evaluate(async () => { const g = window.__game, P = g.race.player; P.kt.d[0] = 1; P.kt.hot = 0; Core.applyDamage(P, 0.009, 1, 0); g.sim(0.1, true); await new Promise(r => requestAnimationFrame(r)); return document.getElementById('wheel-swap').classList.contains('on'); });
  await page.keyboard.press('Enter');
  const after = await page.evaluate(() => ({ wl: window.__game.race.player.wreck.wl, on: document.getElementById('wheel-swap').classList.contains('on') }));
  T.check(`a computer ${vp.width} x ${vp.height}: Enter changes the wheel; the tower in the middle of the top`, k && after.wl === 0 && !after.on && Math.abs((L.strip.left + L.strip.right) / 2 - vp.width / 2) < 2, JSON.stringify(after));
  T.check(`a computer ${vp.width} x ${vp.height}: no page errors`, !errors.length, errors.join(' | '));
  await ctx.close();
}
// 4. the settings: a new player's defaults (Samo videz, Zgoraj); Časovna tabela's three; the old tower Ob zemljevidu
{
  const { page, errors, ctx } = await openGame(browser, srv.base + '/index.html', null, { width: 390, height: 844 }, { touch: true });
  const s = await page.evaluate(async () => { const g = window.__game; g.onAction('to-settings'); await new Promise(r => setTimeout(r, 300));
    const seg = (k) => [...document.querySelectorAll(`[data-set="${k}"] button`)].map(b => b.textContent.trim() + (b.classList.contains('on') ? '*' : ''));
    return { dmg: g.S.damage, tower: g.S.tower, tw: seg('tower'), dm: seg('damage') }; });
  T.check('a new player: Poškodbe avtov Samo videz, Časovna tabela Zgoraj; its choices Izklop · Zgoraj · Ob zemljevidu', s.dmg === 1 && s.tower === 1 && s.tw.join(' ') === 'Izklop Zgoraj* Ob zemljevidu' && s.dm[1] === 'Samo videz*', JSON.stringify(s));
  T.check('settings: no page errors', !errors.length, errors.join(' | '));
  await ctx.close();
}
{   // an existing player with damage Vklop: moved once to Samo videz (tdgp-defaults-v5), then the choice is kept
  const ctx = await browser.newContext({ viewport: { width: 640, height: 360 } }), page = await ctx.newPage();
  await page.addInitScript(() => { if (!sessionStorage.getItem('t')) { sessionStorage.setItem('t', '1'); for (const k of ['tdgp-defaults-v2', 'tdgp-defaults-v3', 'tdgp-defaults-v4', 'tdgp-noadapt']) localStorage.setItem(k, '1'); localStorage.setItem('tdgp-menu', 'old'); localStorage.setItem('tdgp-settings', JSON.stringify({ damage: 2, tower: 1, sound: 0 })); } });
  await page.goto(srv.base + '/index.html'); await page.waitForFunction(() => window.__game, null, { timeout: 180000 });
  const a0 = await page.evaluate(() => window.__game.S.damage), a = await page.evaluate(() => { window.__game.onAction('to-settings'); document.querySelector('[data-set="damage"] button[data-v="2"]').click(); return window.__game.S.damage; });
  await page.reload(); await page.waitForFunction(() => window.__game, null, { timeout: 180000 });
  const b = await page.evaluate(() => window.__game.S.damage);
  T.check('an existing player: damage moved once to Samo videz, a choice after that kept', a0 === 1 && a === 2 && b === 2 && await page.evaluate(() => localStorage.getItem('tdgp-defaults-v5') === '1'));
  await ctx.close();
}
// 5. Ob zemljevidu: the old tower under the map, no row at the top, nothing moved down
{
  const { page, errors, ctx } = await openGame(browser, URL, { tower: 2, quality: 'low', shadows: 0 }, { width: 390, height: 844 }, { touch: true });
  await page.waitForFunction(() => window.__game.quick && window.__game.quick.done, null, { timeout: 240000 });
  const r = await page.evaluate(async () => { const g = window.__game; g.resume(); g.sim(1, true); await new Promise(r => setTimeout(r, 500)); const $ = (id) => document.getElementById(id);
    return { strip: getComputedStyle($('tw-strip')).display, tower: getComputedStyle($('h-tower')).display, rows: $('h-tower').querySelectorAll('.tw-r').length, top: $('h-main').getBoundingClientRect().top }; });
  T.check('Ob zemljevidu: the old tower under the map, no row at the top, the top left where it was', r.strip === 'none' && r.tower === 'flex' && r.rows > 3 && r.top < 20, JSON.stringify(r));
  T.check('Ob zemljevidu: no page errors', !errors.length, errors.join(' | '));
  await ctx.close();
}
await browser.close(); await srv.close();
T.done();
