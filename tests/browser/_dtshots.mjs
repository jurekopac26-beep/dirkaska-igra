// scratch: screenshots of Detroit (not a test)
import { serve, launch, openGame, startTrack } from './lib.mjs';
const OUT = process.env.OUT, spots = JSON.parse(process.env.SPOTS || '[[0,"iso"]]'), vp = process.env.VP === 'p' ? { width: 390, height: 844 } : { width: 844, height: 390 };
const srv = await serve(); const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: process.env.CAM || 'iso', weather: process.env.WX || 'dry', tod: process.env.TOD || 'day', track: 'detroit' }, vp);
  const t0 = Date.now(); await startTrack(page, 'detroit'); console.log('load', Date.now() - t0, 'ms');
  console.log(JSON.stringify(await page.evaluate(() => Render.world && Render.world.stats)));
  await page.addStyleTag({ content: '*{visibility:hidden !important} canvas{visibility:visible !important}' });
  for (const [d, mode, lat] of spots) {
    await page.evaluate(([d, mode, lat]) => { const g = window.__game, P = g.race.player, T = g.race.track; g.pause();
      const s = ((T.startS + d) % T.len + T.len) % T.len, i = T.idx(s); P.x = P.px = T.px[i] + T.nx[i] * (lat || 0); P.z = P.pz = T.pz[i] + T.nz[i] * (lat || 0); P.h = P.ph = T.hd[i]; P.vx = Math.cos(P.h) * 30; P.vz = Math.sin(P.h) * 30; P.speed = 30; P.y = P.roadY = T.hy[i];
      for (let k = 0; k < 40; k++) Render.frame(1 / 30, 1, P, mode, {}); }, [d, mode, lat]);
    await page.screenshot({ path: `${OUT}/${process.env.TAG || 's'}_${d}_${mode}.png` });
  }
  console.log(errors.slice(0, 10).join('\n'));
} finally { await browser.close(); await srv.close(); }
