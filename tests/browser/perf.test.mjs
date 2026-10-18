// Phone budget: on a phone-size screen (844x390, quality 'normal', graphics detail 'low' = NIZKA, shadows on, chase
// camera) every track is driven on autopilot and the WebGL work per frame is counted (draw calls and vertices of all
// passes: shadows and scene) at six places around the lap. The NIZKA tier is the one the weakest phones run, so this is
// the budget from CLAUDE.md (up to ~300 draw calls and ~900k vertices per track); the higher tiers may exceed it.
// Fails when the busiest of them needs more than tests/golden/perf.json allows (+10 % +5 draw
// calls, +10 % +20k vertices), e.g. a change that makes a track or car too heavy for phones. The JavaScript time of
// physics+AI and of the render-side updates is only printed (it depends on the machine).
// Then the new map of NEW VERSION · TEST 1 (js/newmap.js over Toskana, its still meshes merged by js/nvbake.js): the same budget at
// twelve places round it (HOME, the garages, the infield, the hill, the motocross, the coast), behind the car (the
// game's one camera), as 'newmap'.
//   node tests/browser/perf.test.mjs            check
//   node tests/browser/perf.test.mjs --update   write new reference values
//   PERF_ONLY=newmap,toskana node tests/browser/perf.test.mjs [--update]   only these (--update: the others' values kept)
import fs from 'node:fs';
import path from 'node:path';
import { REPO, serve, launch, openGame, startTrack, trackIds, checker } from './lib.mjs';

const FILE = path.join(REPO, 'tests', 'golden', 'perf.json');
// the new map (NEW VERSION · TEST 1, the title's button in the new menu): built and merged, the game stood still, the car put at each
// place, the camera behind it; the busiest frame is checked as a track's is
async function newMap() {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', detail: 'low', shadows: 1, camera: 'chase', zoom: 1.2 }, { width: 844, height: 390 }, { seed: 12345, menu: true });
  await page.evaluate(() => {
    window.__gl = { calls: 0, verts: 0 };
    const gl = document.querySelector('canvas').getContext('webgl2') || document.querySelector('canvas').getContext('webgl');
    const P = Object.getPrototypeOf(gl), wrap = (name, count) => { const f = P[name]; if (!f) return; P[name] = function (...a) { window.__gl.calls++; window.__gl.verts += count(a); return f.apply(this, a); }; };
    wrap('drawElements', a => a[1]); wrap('drawArrays', a => a[2]); wrap('drawElementsInstanced', a => a[1] * a[4]); wrap('drawArraysInstanced', a => a[2] * a[3]);
  });
  await page.waitForFunction(() => window.Menu && Menu.ready && document.getElementById('menu-host').shadowRoot.querySelector('#s-title'), null, { timeout: 120000 });
  await page.evaluate(() => document.getElementById('menu-host').shadowRoot.querySelector('[data-act="newver"]').click());
  await page.waitForFunction(() => { const g = window.__game; return g && g.race && g.race.nv && !document.getElementById('nv-load') && g.phase === 'racing'; }, null, { timeout: 600000, polling: 500 });
  const r = await page.evaluate(() => {
    const g = window.__game, P = g.race.player, H3 = window.__H3; g.pause();
    const st = (k) => { const f = NVMenu.floors().find(q => q.key === k); return { x: f.x, z: f.z, h: f.h }; }, a0 = MK.at(0);
    const places = [{ x: H3.home.x, z: H3.home.z, h: H3.home.h }, { x: a0.x, z: a0.z, h: 0 }, st('school'), st('circuit'), st('home'), st('police'), st('multi'),
      { x: 40, z: 20, h: 0 }, { x: 20, z: 120, h: -1.6 }, { x: -205, z: -105, h: 0 }, { x: -272, z: -216, h: 0 }, { x: 300, z: -250, h: 1.6 }];
    const s = [];
    for (const cam of ['chase']) for (const p of places) {
      P.place(p.x, p.z, p.h); P.vx = P.vz = 0; g.sim(0.2, true);
      Render.resetCam(); for (let i = 0; i < 10; i++) Render.frame(1 / 60, 1, P, cam, {});
      const c0 = __gl.calls, v0 = __gl.verts; Render.frame(1 / 60, 1, P, cam, {}); s.push([__gl.calls - c0, __gl.verts - v0]);
    }
    const c = s.map(x => x[0]), v = s.map(x => x[1]);
    return { calls: Math.round(c.reduce((a, b) => a + b) / c.length), maxCalls: Math.max(...c), kverts: Math.round(v.reduce((a, b) => a + b) / v.length / 1000), maxKverts: Math.round(Math.max(...v) / 1000), jsMs: 0 };
  });
  out.newmap = r;
  const gd = golden.newmap, line = `calls/frame ${r.calls} (max ${r.maxCalls}), vertices/frame ${r.kverts}k (max ${r.maxKverts}k)`;
  if (update) console.log(`${'newmap'.padEnd(10)} ${line}`);
  else if (!gd) T.check('newmap: within the phone budget', false, 'no reference');
  else {
    const why = [];
    if (r.maxCalls > gd.maxCalls * 1.1 + 5) why.push(`draw calls ${r.maxCalls} > ${Math.round(gd.maxCalls * 1.1 + 5)}`);
    if (r.maxKverts > gd.maxKverts * 1.1 + 20) why.push(`vertices ${r.maxKverts}k > ${Math.round(gd.maxKverts * 1.1 + 20)}k`);
    T.check('newmap (NEW VERSION · TEST 1): within the phone budget', !why.length, line + (why.length ? ' — ' + why.join(', ') : ''));
  }
  T.check('newmap: no page errors', !errors.length, errors.slice(0, 5).join(' | '));
  await ctx.close();
}
const update = process.argv.includes('--update');
const only = process.env.PERF_ONLY ? process.env.PERF_ONLY.split(',') : null;   // (only these tracks, 'newmap' among them)
const golden = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {};
const T = checker('phone budget (844x390, normal quality, NIZKA detail, shadows)');
const srv = await serve();
const browser = await launch();
const out = {};
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', detail: 'low', shadows: 1, camera: 'chase', zoom: 1.2 }, { width: 844, height: 390 }, { seed: 12345 });
  await page.evaluate(() => {   // count every WebGL draw (all render passes)
    window.__gl = { calls: 0, verts: 0 };
    const gl = Render.info && document.querySelector('canvas').getContext('webgl2') || document.querySelector('canvas').getContext('webgl');
    const P = Object.getPrototypeOf(gl), wrap = (name, count) => { const f = P[name]; if (!f) return; P[name] = function (...a) { window.__gl.calls++; window.__gl.verts += count(a); return f.apply(this, a); }; };
    wrap('drawElements', a => a[1]); wrap('drawArrays', a => a[2]);
    wrap('drawElementsInstanced', a => a[1] * a[4]); wrap('drawArraysInstanced', a => a[2] * a[3]);
  });
  for (const id of await trackIds(page)) {
    if (only && !only.includes(id)) continue;
    await startTrack(page, id);
    const r = await page.evaluate(() => {
      // a fresh race with Math.random seeded, paused at once: nothing moves by itself, the race is stepped and drawn only
      // here, in one go, so the counts are the same every run
      const g = window.__game; let seed = 12345; Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      g.onAction('restart'); g.pause();
      g.race.lch = null; for (const c of g.race.cars) c.lch = null;   // (the start's reaction off: the samples measure what is drawn, at the same spots on the lap as ever)
      const P = g.race.player, s = [];
      let tPhys = 0, tRend = 0;
      for (let k = 0; k < 6; k++) {
        const dt = Math.min(30, g.race.track.len / 45 / 6); for (let i = 0; i < dt; i++) g.sim(1, true);
        Render.resetCam(); for (let i = 0; i < 10; i++) Render.frame(1 / 60, 1, P, g.S.camera, {});   // the camera settles
        const c0 = __gl.calls, v0 = __gl.verts; Render.frame(1 / 60, 1, P, g.S.camera, {}); s.push([__gl.calls - c0, __gl.verts - v0]);
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
    if (r.maxCalls > g.maxCalls * 1.1 + 5) why.push(`draw calls ${r.maxCalls} > ${Math.round(g.maxCalls * 1.1 + 5)}`);
    if (r.maxKverts > g.maxKverts * 1.1 + 20) why.push(`vertices ${r.maxKverts}k > ${Math.round(g.maxKverts * 1.1 + 20)}k`);
    T.check(`${id}: within the phone budget`, !why.length, line + (why.length ? ' — ' + why.join(', ') : ''));
  }
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
  if (!only || only.includes('newmap')) await newMap();
} finally {
  await browser.close(); await srv.close();
}
if (update) { fs.writeFileSync(FILE, JSON.stringify(only ? Object.assign({}, golden, out) : out, null, 1) + '\n'); console.log('written ' + FILE); }
else T.done();
