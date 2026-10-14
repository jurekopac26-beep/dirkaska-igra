import { serve, launch, openGame, startTrack } from './lib.mjs';
const srv = await serve(); const browser = await launch();
const { page } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0 }, { width: 390, height: 844 });
await startTrack(page, 'riviera');
await page.evaluate(() => { window.__ft = []; let l = performance.now(); const f = (n) => { window.__ft.push({ dt: Math.round(n - l), t: window.__game.demo && +window.__game.demo.time.toFixed(2) }); l = n; if (window.__ft.length < 40) requestAnimationFrame(f); }; requestAnimationFrame(f); const t0 = performance.now(); window.__game.onAction('to-title'); window.__tt = performance.now() - t0; });
await page.waitForTimeout(40000);
console.log(await page.evaluate(() => JSON.stringify({ tt: window.__tt, ft: window.__ft, m: window.__game.demoModel })));
await browser.close(); await srv.close();
