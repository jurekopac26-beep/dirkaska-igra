// The vegetation's fade at the detail distance (Grafika AAA V1, js/render-rastje.js): on a track of ON (Spa, Belgija) the chunks reaching
// into the fade's band are drawn with their twin (the same draw calls and vertices); on NIZKA (dd 165, inside the haze) the picture changed
// a little, far away; every program of the fade compiled before the start (none while driving, the shadow pass's included); on a frozen
// track (Jezero) nothing swapped and the picture the same to the bit as with the module off.
//   node tests/browser/rastje.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('vegetation fade (V1)');
const srv = await serve();
const browser = await launch();
const SET = { quality: 'normal', detail: 'low', shadows: 1, camera: 'chase', weather: 'dry', tod: 'day', season: 'summer', zoom: 1.4 };
const race = async (page, id, m) => {
  await page.goto(srv.base + '/index.html?proga=' + id + '&t=0.5');
  await page.waitForFunction(() => window.__game && window.__game.quick && window.__game.quick.done, null, { timeout: 300000 });
  await page.evaluate(async (m) => {
    const g = window.__game, R = g.race, Tr = R.track, P = R.player, raf = () => new Promise(r => requestAnimationFrame(r)); g.pause();
    const i = Tr.idx((Tr.startS + m) % Tr.len); const off = Tr.rl ? Tr.rl[i] : 0; P.place(Tr.px[i] + Tr.nx[i] * off, Tr.pz[i] + Tr.nz[i] * off, Tr.hd[i]); if (Tr.hasElev) P.y = P.py = Tr.hy[i];
    P.q = Tr.query(P.x, P.z, i, P.q); P.sPrev = P.q.s; P.vx = P.vz = 0;
    for (let k = 0; k < 60; k++) { for (const c of R.cars) { c.vx = 0; c.vz = 0; c.w = 0; } P.inThr = 0; P.inBrk = 1; P.inSteer = 0; R.step(1 / 120); }
    Render.resetCam(); for (let k = 0; k < 8; k++) { Render.frame(1 / 60, 1, P, 'chase', {}); await raf(); }
  }, m);
};
// a frame with the fade as asked (mode: null as the track says, 'off'): the swapped chunks, the draw calls and vertices, the programs, the pixels
const frame = (page, mode) => page.evaluate((mode) => {
  const V1 = () => Render.info().programs.filter(p => /\|v1|v1depth/.test(p.cacheKey)).length;
  const X = Render.ext.rastje, P = window.__game.race.player, I = Render.info();
  X.debug.mode = mode; Render.frame(0, 1, P, 'chase', {});
  I.autoReset = false; I.reset(); Render.frame(0, 1, P, 'chase', {}); const calls = I.render.calls, tris = I.render.triangles; I.autoReset = true;
  const band = X.stats().band, all = X.stats().all;
  const src = document.querySelector('canvas'), c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
  const x = c.getContext('2d'); x.drawImage(src, 0, 0); const px = Array.from(x.getImageData(0, 0, c.width, c.height).data);
  X.debug.mode = null;
  return { on: X.on(), band, all, calls, tris, progs: V1(), px };
}, mode);
const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 6) n++; return +(n / (a.length / 4) * 100).toFixed(3); };
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', SET, { width: 844, height: 390 }, { seed: 11 });
  T.check('js/render-rastje.js loaded (Render.ext.rastje), Spa in ON', await page.evaluate(() => !!(Render.ext && Render.ext.rastje) && Render.ext.rastje.ON.has('spa')));

  // 1. Spa (Belgija), NIZKA, 5900 m (trees in the band in view): the band's chunks swapped; the same draw calls and triangles; the picture changed a little (far away)
  await race(page, 'spa', 5900);
  const p0 = await page.evaluate(() => Render.info().programs.filter(p => /\|v1|v1depth/.test(p.cacheKey)).length);
  const on = await frame(page, null), off = await frame(page, 'off'), on2 = await frame(page, null);
  T.check('Spa: the fade on, some chunks in its band (not all)', on.on && on.band > 0 && on.band < on.all && off.band === 0, JSON.stringify([on.band, on.all, off.band]));
  T.check('Spa: no draw call and no triangle more for it', on.calls === off.calls && on.tris === off.tris, JSON.stringify([on.calls, off.calls, on.tris, off.tris]));
  const d = diff(on.px, off.px);
  T.check('Spa: the picture with the fade differs a little from the one without (the far trees), the same again with it', d > 0 && d < 15 && diff(on.px, on2.px) === 0, JSON.stringify({ d }));
  T.check('Spa: every program of the fade compiled before the start (none while drawing, the shadow pass\'s included)', p0 > 0 && on.progs === p0 && on2.progs === p0, JSON.stringify([p0, on.progs, on2.progs]));
  // driving on: 8 s of the lap, still no program compiled
  const drv = await page.evaluate(() => {
    const g = window.__game, P = g.race.player, V1 = () => Render.info().programs.filter(p => /\|v1|v1depth/.test(p.cacheKey)).length, n0 = V1(); let mx = 0;
    for (let k = 0; k < 40; k++) { for (let i = 0; i < 12; i++) g.sim(1 / 60, true); Render.frame(1 / 60, 1, P, 'chase', {}); mx = Math.max(mx, Render.ext.rastje.stats().band); }
    return { n0, n1: V1(), mx };
  });
  T.check('Spa: driving on, no program of the fade compiled (the band\'s chunks changing)', drv.n1 === drv.n0 && drv.mx > 0, JSON.stringify(drv));

  // 2. Jezero (frozen): nothing swapped, the picture as with the module off
  await race(page, 'jezero', 600);
  const j = await frame(page, null), j0 = await frame(page, 'off');
  T.check('Jezero (frozen): off, nothing swapped, the picture as with it off', !j.on && j.band === 0 && diff(j.px, j0.px) === 0, JSON.stringify([j.on, j.band]));
  T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
