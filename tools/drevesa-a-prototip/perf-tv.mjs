// Vršič on a phone (844x390, quality normal, detail low, shadows, chase), as tests/browser/perf.test.mjs: the world as now (A), with the new trees (B), with everything but the clouds (C)
import path from 'node:path';
import { serve, launch, openGame, startTrack } from '/home/user/dirkaska-igra/tests/browser/lib.mjs';
const srv = await serve(path.join(path.dirname(new URL(import.meta.url).pathname), 'proto2'));
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', detail: 'low', shadows: 1, camera: 'chase', zoom: 1.2 }, { width: 844, height: 390 }, { seed: 12345 });
  await page.evaluate(() => { window.__gl = { calls: 0, verts: 0 }; const gl = document.querySelector('canvas').getContext('webgl2') || document.querySelector('canvas').getContext('webgl');
    const P = Object.getPrototypeOf(gl), wrap = (n, c) => { const f = P[n]; if (!f) return; P[n] = function (...a) { window.__gl.calls++; window.__gl.verts += c(a); return f.apply(this, a); }; };
    wrap('drawElements', a => a[1]); wrap('drawArrays', a => a[2]); wrap('drawElementsInstanced', a => a[1] * a[4]); wrap('drawArraysInstanced', a => a[2] * a[3]); });
  await startTrack(page, 'vrsic');
  const r = await page.evaluate(() => {
    const g = window.__game, T = g.race.track, P = g.race.player; g.pause();
    const measure = (sty) => { window.__STY = sty; Render.buildWorld(T, 1, 0); const s = [];
      const at = (sv) => { const i = T.idx(sv); P.place(T.px[i] + T.nx[i] * 1.6, T.pz[i] + T.nz[i] * 1.6, T.hd[i]); P.y = P.py = T.hy[i]; P.roadY = P.y; P.q = T.query(P.x, P.z, i, P.q);
        Render.resetCam(); for (let f = 0; f < 10; f++) Render.frame(1 / 60, 1, P, g.S.camera, {}); const c0 = __gl.calls, v0 = __gl.verts; Render.frame(1 / 60, 1, P, g.S.camera, {}); s.push([__gl.calls - c0, __gl.verts - v0]); };
      for (let k = 0; k < 6; k++) at(T.startS + (k + 0.5) / 6 * (T.finishS - T.startS)); at(T.startS + 20); at(T.finishS - 30);
      const c = s.map(x => x[0]), v = s.map(x => x[1]);
      return { avgCalls: Math.round(c.reduce((a, b) => a + b) / c.length), maxCalls: Math.max(...c), avgKverts: Math.round(v.reduce((a, b) => a + b) / v.length / 1000), maxKverts: Math.round(Math.max(...v) / 1000) }; };
    const out = { zdaj: measure(null), karte3: measure({ keep: true, road: 'toon', tv: 6, only: { edge: 1, road: 1, grass: 1, trees: 1 } }) }; for (const v of 'ABCDE') out[v] = measure({ keep: true, road: 'toon', tv: 6, trv: v, only: { edge: 1, road: 1, grass: 1, trees: 1 } }); return out;
  });
  console.log(JSON.stringify(r));
  if (errors.length) console.log('ERRORS', errors.slice(0, 3));
} finally { await browser.close(); await srv.close(); }
