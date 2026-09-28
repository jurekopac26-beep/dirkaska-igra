// Phone budget: on a phone-size screen (844x390, quality 'normal', shadows on, chase camera) every track is driven on
// autopilot and the WebGL work per frame is counted (draw calls and vertices of all passes: shadows and scene) at six
// places around the lap, plus the JavaScript time of physics+AI and of the render-side updates. Fails when a track
// needs more than 30 % above tests/golden/perf.json (e.g. a new track or car that would be too heavy for phones).
//   node tests/browser/perf.test.mjs            check
//   node tests/browser/perf.test.mjs --update   write new reference values
import fs from 'node:fs';
import path from 'node:path';
import { REPO, serve, launch, openGame, startTrack, trackIds, checker } from './lib.mjs';

const FILE = path.join(REPO, 'tests', 'golden', 'perf.json');
const update = process.argv.includes('--update');
const golden = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {};
const T = checker('phone budget (844x390, normal quality, shadows)');
const srv = await serve();
const browser = await launch();
const out = {};
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 1, camera: 'chase', zoom: 1.2 }, { width: 844, height: 390 }, { seed: 12345 });
  await page.evaluate(() => {   // count every WebGL draw (all render passes)
    window.__gl = { calls: 0, verts: 0 };
    const gl = Render.info && document.querySelector('canvas').getContext('webgl2') || document.querySelector('canvas').getContext('webgl');
    const P = Object.getPrototypeOf(gl), wrap = (name, count) => { const f = P[name]; if (!f) return; P[name] = function (...a) { window.__gl.calls++; window.__gl.verts += count(a); return f.apply(this, a); }; };
    wrap('drawElements', a => a[1]); wrap('drawArrays', a => a[2]);
    wrap('drawElementsInstanced', a => a[1] * a[4]); wrap('drawArraysInstanced', a => a[2] * a[3]);
  });
  for (const id of await trackIds(page)) {
    await startTrack(page, id);
    const r = await page.evaluate(async () => {
      const g = window.__game, raf = () => new Promise(r => requestAnimationFrame(r)), s = [];
      let tPhys = 0, tRend = 0;
      for (let k = 0; k < 6; k++) {
        const dt = Math.min(30, g.race.track.len / 45 / 6); for (let i = 0; i < dt; i++) g.sim(1, true);
        Render.resetCam(); for (let i = 0; i < 4; i++) await raf();
        const c0 = __gl.calls, v0 = __gl.verts; await raf(); s.push([__gl.calls - c0, __gl.verts - v0]);
        let t0 = performance.now(); for (let i = 0; i < 30; i++) g.sim(1 / 60, true); tPhys += performance.now() - t0;
        Render.scene.visible = false; t0 = performance.now(); for (let i = 0; i < 30; i++) Render.frame(1 / 60, 1, g.race.player, g.S.camera, {}); tRend += performance.now() - t0; Render.scene.visible = true;
      }
      const c = s.map(x => x[0]), v = s.map(x => x[1]);
      return { calls: Math.round(c.reduce((a, b) => a + b) / c.length), maxCalls: Math.max(...c), kverts: Math.round(v.reduce((a, b) => a + b) / v.length / 1000), maxKverts: Math.round(Math.max(...v) / 1000),
        jsMs: +((tPhys + tRend) / 180).toFixed(2) };
    });
    out[id] = r;
    const g = golden[id], line = `calls/frame ${r.calls} (max ${r.maxCalls}), vertices/frame ${r.kverts}k (max ${r.maxKverts}k), JS ${r.jsMs} ms/frame`;
    if (update) { console.log(`${id.padEnd(10)} ${line}`); continue; }
    if (!g) { T.check(`${id}: within the phone budget`, false, 'no reference'); continue; }
    const why = [];
    if (r.maxCalls > g.maxCalls * 1.3 + 10) why.push(`draw calls ${r.maxCalls} > ${Math.round(g.maxCalls * 1.3 + 10)}`);
    if (r.maxKverts > g.maxKverts * 1.3 + 20) why.push(`vertices ${r.maxKverts}k > ${Math.round(g.maxKverts * 1.3 + 20)}k`);
    T.check(`${id}: within the phone budget`, !why.length, line + (why.length ? ' — ' + why.join(', ') : ''));
  }
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
if (update) { fs.writeFileSync(FILE, JSON.stringify(out, null, 1) + '\n'); console.log('written ' + FILE); }
else T.done();
