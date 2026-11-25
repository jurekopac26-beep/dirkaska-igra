// js/perf-gore.js: the same frame drawn twice in one go, with the joined meshes and without (the scene's onAfterRender wrapped, so
// perf-gore's hook does not swap them in), on the tracks of World.perfGore.BY (NIZKA, 844x390, the chase camera, 6 places round the lap
// as tests/browser/perf.test.mjs): the pixels that differ and the draw calls and vertices of both frames.
//   node tools/perf-gore-slika.mjs                      every track in BY
//   PROGE=kotor,furka node tools/perf-gore-slika.mjs    only these
//   DEZ=1 ...                                           in the rain (Render.setStorm off, the race's weather: rain)
import { serve, launch, openGame, startTrack } from '../tests/browser/lib.mjs';

const srv = await serve(), browser = await launch();
const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', detail: 'low', shadows: 1, camera: 'chase', zoom: 1.2, camShake: 1, camLand: 1, camKerb: 1, camMis: 1, crV: 4, ...(process.env.DEZ ? { weather: 'rain' } : {}) }, { width: 844, height: 390 }, { seed: 12345 });
await page.evaluate(() => {
  window.__gl = { calls: 0, verts: 0 };
  const gl = document.querySelector('canvas').getContext('webgl2') || document.querySelector('canvas').getContext('webgl');
  const P = Object.getPrototypeOf(gl), wrap = (name, count) => { const f = P[name]; if (!f) return; P[name] = function (...a) { window.__gl.calls++; window.__gl.verts += count(a); return f.apply(this, a); }; };
  wrap('drawElements', a => a[1]); wrap('drawArrays', a => a[2]); wrap('drawElementsInstanced', a => a[1] * a[4]); wrap('drawArraysInstanced', a => a[2] * a[3]);
});
const ids = process.env.PROGE ? process.env.PROGE.split(',') : await page.evaluate(() => Object.keys(World.perfGore.BY));
let bad = 0;
for (const id of ids) {
  await startTrack(page, id);
  const r = await page.evaluate(async () => {
    if (Render.world.landmarkLoad) await Render.world.landmarkLoad;
    const g = window.__game; let seed = 12345; Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    g.onAction('restart'); g.pause();
    g.race.lch = null; for (const c of g.race.cars) c.lch = null; g.race.player.kt = null;
    const P = g.race.player, gl = document.querySelector('canvas').getContext('webgl2') || document.querySelector('canvas').getContext('webgl');
    const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight, sc = Render.scene;
    const shot = () => { const c0 = __gl.calls, v0 = __gl.verts; Render.frame(0, 1, P, g.S.camera, {}); const px = new Uint8Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px); return { px, calls: __gl.calls - c0, verts: __gl.verts - v0 }; };
    const out = [];
    for (let k = 0; k < 6; k++) {
      const dt = Math.min(30, g.race.track.len / 45 / 6); for (let i = 0; i < dt; i++) g.sim(1, true);
      Render.resetCam(); for (let i = 0; i < 10; i++) Render.frame(1 / 60, 1, P, g.S.camera, {});
      const a = shot(), a0 = sc.onAfterRender; sc.onAfterRender = function () { return a0.apply(this, arguments); };
      const b = shot(); sc.onAfterRender = a0;
      const c = shot();   // (joined again: the same as a, else the frame itself is not still)
      let diff = 0, max = 0, still = 0;
      for (let i = 0; i < a.px.length; i += 4) {
        let d = 0; for (let j = 0; j < 3; j++) d = Math.max(d, Math.abs(a.px[i + j] - b.px[i + j]));
        if (d) { diff++; max = Math.max(max, d); }
        if (a.px[i] !== c.px[i] || a.px[i + 1] !== c.px[i + 1] || a.px[i + 2] !== c.px[i + 2]) still++;
      }
      out.push({ diff, max, still, on: [a.calls, Math.round(a.verts / 1000)], off: [b.calls, Math.round(b.verts / 1000)] });
    }
    return { out, last: World.perfGore.last };
  });
  const s = r.out, avg = (f) => Math.round(s.reduce((x, q) => x + f(q), 0) / s.length), mx = (f) => Math.max(...s.map(f));
  const px = s.reduce((x, q) => x + q.diff, 0), still = s.reduce((x, q) => x + q.still, 0);
  if (px) bad++;
  console.log(`${id.padEnd(11)} klici ${avg(q => q.off[0])}/${mx(q => q.off[0])} -> ${avg(q => q.on[0])}/${mx(q => q.on[0])}, oglisca ${mx(q => q.off[1])}k -> ${mx(q => q.on[1])}k, razlika ${px} px (najvec ${mx(q => q.max)})${still ? `, nemirna slika ${still} px` : ''}, ${JSON.stringify(r.last)}`);
}
console.log(errors.length ? 'NAPAKE: ' + errors.slice(0, 5).join(' | ') : 'brez napak strani');
await browser.close(); srv.close();
process.exit(bad || errors.length ? 1 : 0);
