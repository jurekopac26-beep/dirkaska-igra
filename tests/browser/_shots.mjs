// (scratch) screenshots of a track at several places, in a camera and weather: node tests/browser/_shots.mjs <track> <cam> <weather> <tod> <d,d,...>
import { serve, launch, openGame, startTrack } from './lib.mjs';
const [id, cam, weather, tod, ds, outDir] = process.argv.slice(2);
const srv = await serve(), browser = await launch();
try {
  const portrait = cam === 'chase';
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: cam, zoom: 1.2, weather, tod, season: 'summer' }, portrait ? { width: 390, height: 844 } : { width: 844, height: 390 }, { seed: 7 });
  page.on('console', m => { if (m.type() === 'log') console.log('page:', m.text()); });
  await startTrack(page, id);
  const st = await page.evaluate(() => { const g = window.__game; g.pause(); const css = document.createElement('style'); css.textContent = '.screen, #hud, .overlay, .menu { display: none !important }'; document.head.appendChild(css); window.__gl = { calls: 0, verts: 0 };
    const gl = document.querySelector('canvas').getContext('webgl2') || document.querySelector('canvas').getContext('webgl');
    const P = Object.getPrototypeOf(gl), wrap = (name, count) => { const f = P[name]; if (!f) return; P[name] = function (...a) { window.__gl.calls++; window.__gl.verts += count(a); return f.apply(this, a); }; };
    wrap('drawElements', a => a[1]); wrap('drawArrays', a => a[2]); wrap('drawElementsInstanced', a => a[1] * a[4]); wrap('drawArraysInstanced', a => a[2] * a[3]);
    return JSON.stringify(Render.world && Render.world.stats || (g.world && g.world.stats) || null); });
  console.log('stats', st);
  for (const d of ds.split(',').map(Number)) {
    const r = await page.evaluate((d) => { const g = window.__game, T = g.race.track, P = g.race.player, i = T.idx(T.startS + d);
      P.x = T.px[i] + T.nx[i] * T.rl[i]; P.z = T.pz[i] + T.nz[i] * T.rl[i]; P.h = T.hd[i]; P.vx = P.tx = 0; P.vz = 0; P.speed = 0; P.q = T.query(P.x, P.z, i, P.q);
      Render.resetCam(); for (let k = 0; k < 12; k++) Render.frame(1 / 60, 1, P, g.S.camera, {});
      const c0 = __gl.calls, v0 = __gl.verts; Render.frame(1 / 60, 1, P, g.S.camera, {}); return [__gl.calls - c0, Math.round((__gl.verts - v0) / 1000)]; }, d);
    console.log(d, 'calls', r[0], 'kverts', r[1]);
    await page.screenshot({ path: `${outDir}/${id}-${cam}-${weather}-${tod}-${d}.png` });
  }
  if (errors.length) console.log('ERRORS', errors.slice(0, 5));
} finally { await browser.close(); await srv.close(); }
