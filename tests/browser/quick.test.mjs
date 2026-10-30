// The quick entry (hitri vstop, sklop 3 of docs/orodje-za-napake.md): an address ?proga=<id>&nacin=<way>&t=<s>&vreme=suho|dez&avto=<id>
// opens the game straight on a race. Bathurst from the new menu (as a player's phone has it): the race at once, no menu, no qualifying.
// Vršič in the traffic, in the rain, in the BIZON 70, driven on to 20 s after the start: there and paused.
// An unknown track: the title, a toast that names what is not valid.
// The Nordschleife with tekmeci=21&lod=0: 22 cars, LOD off.
//   node tests/browser/quick.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('quick');
const srv = await serve();
const browser = await launch();
const state = (page) => page.evaluate(() => { const g = window.__game, r = g.race;
  return { quick: g.quick, screen: g.screen, phase: g.phase, track: r && r.track.def.id, time: r ? +r.time.toFixed(2) : null, car: r && r.player && r.player.m.id, rain: r ? r.rain : null, tf: !!(r && r.tf), quali: !!(r && r.quali), cars: r ? r.cars.length : 0, S: { track: g.S.track, mode: g.S.mode, weather: g.S.weather },
    toast: document.getElementById('toast').classList.contains('show') ? document.getElementById('toast').textContent : '' }; });
const there = (page) => page.waitForFunction(() => window.__game.quick && window.__game.quick.done, null, { timeout: 240000 });
try {
  // 1. Bathurst, from the new menu: on the race, no menu, the whole field
  {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?proga=bathurst', { quali: 1 }, { width: 640, height: 360 }, { menu: true });
    await there(page); await page.waitForTimeout(1500);
    const s = await state(page);
    T.check('?proga=bathurst: the race on Bathurst at once (no menu, no qualifying, the whole field), running', s.track === 'bathurst' && s.screen === 'none' && !s.quali && s.cars > 10 && ['intro', 'lights', 'racing'].includes(s.phase) && s.quick.q.track === 'bathurst' && !s.quick.q.bad.length, JSON.stringify(s));
    T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
  // 2. Vršič, the traffic, rain, a car, t: driven on to 20 s and paused there
  {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?proga=vrsic&nacin=promet&vreme=dez&avto=bizon&t=20', {}, { width: 360, height: 640 });
    await there(page);
    const s = await state(page);
    T.check('?proga=vrsic&nacin=promet&vreme=dez&avto=bizon: the duel in the traffic, wet, in the BIZON 70, the choices kept as the menus keep them', s.track === 'vrsic' && s.tf && s.rain === 1 && s.car === 'bizon' && s.S.mode === 'traffic' && s.S.weather === 'rain', JSON.stringify(s));
    T.check('&t=20: the race 20 s after the start, paused there (the pause screen)', s.phase === 'racing' && s.time >= 20 && s.time < 20.1 && s.screen === 'pause', JSON.stringify({ phase: s.phase, time: s.time, screen: s.screen }));
    T.check('the loading screen gone', await page.evaluate(() => document.getElementById('loading').classList.contains('off')));
    T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
  // 3. an unknown track: the title, the toast names it
  {
    // (every toast's text kept: on a slow machine the game may take longer to start than the toast stays)
    const init = () => document.addEventListener('DOMContentLoaded', () => { const el = document.getElementById('toast'); window.__toasts = []; new MutationObserver(() => window.__toasts.push(el.textContent)).observe(el, { childList: true, characterData: true, subtree: true }); });
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?proga=nikjer&vreme=sneg', {}, { width: 640, height: 360 }, { init });
    await there(page); await page.waitForTimeout(500);
    const s = await state(page), toasts = await page.evaluate(() => window.__toasts);
    T.check('?proga=nikjer&vreme=sneg: no race, the title; a toast names what is not valid', s.quick.q.track === null && s.track == null && s.screen === 'title' && toasts.some(t => /proga=nikjer, vreme=sneg/.test(t)), JSON.stringify({ s, toasts }));
    T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
  // 4. the Nordschleife with 21 rivals and LOD off (the comparison of 100 / 22 / 1 cars on the same road)
  {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?proga=nring&tekmeci=21&lod=0', {}, { width: 640, height: 360 });
    await there(page); await page.waitForTimeout(500);
    const s = await state(page), off = await page.evaluate(() => Core.LOD.off);
    T.check('?proga=nring&tekmeci=21&lod=0: the race on the Nordschleife with 22 cars (its own 100 otherwise), LOD off', s.track === 'nring' && s.cars === 22 && off === true && s.quick.q.rivals === 21 && !s.quick.q.bad.length, JSON.stringify({ track: s.track, cars: s.cars, off, q: s.quick.q }));
    T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
} finally {
  await browser.close(); await srv.close();
}
T.done();
