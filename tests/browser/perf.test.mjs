// Phone budget: on a phone-size screen (844x390, quality 'normal', graphics detail 'low' = NIZKA, shadows on, chase
// camera, its shake on: SHAKE) every track is driven on autopilot and the WebGL work per frame is counted (draw calls and vertices of all
// passes: shadows and scene) at six places around the lap. The NIZKA tier is the one the weakest phones run, so this is
// the budget from CLAUDE.md (up to ~300 draw calls and ~900k vertices per track); the higher tiers may exceed it.
// Fails when the busiest of them needs more than tests/golden/perf.json allows (+10 % +5 draw
// calls, +10 % +20k vertices), e.g. a change that makes a track or car too heavy for phones; and when a real track (not one
// marked test: true, kept for testing only) needs more than the budget itself, 300 draw calls or 900k vertices, on average or at the
// busiest of the six places (maxCalls, maxKverts; the new map not: it has only its reference's margin). The JavaScript time of
// physics+AI and of the render-side updates is only printed (it depends on the machine).
// Then the new map of NEW VERSION · TEST 1 (js/newmap.js over Toskana, its still meshes merged by js/nvbake.js): the same budget at
// twelve places round it (HOME, the garages, the infield, the hill, the motocross, the coast), behind the car (the
// game's one camera), as 'newmap'.
//   node tests/browser/perf.test.mjs            check
//   node tests/browser/perf.test.mjs --update   write new reference values
//   PERF_ONLY=newmap,toskana node tests/browser/perf.test.mjs [--update]   only these (--update: the others' values kept)
import fs from 'node:fs';
import path from 'node:path';
import { REPO, serve, launch, openGame, startTrack, trackIds, checker, tapNewVersion } from './lib.mjs';

const FILE = path.join(REPO, 'tests', 'golden', 'perf.json');
// the camera's shake on (Nastavitve · Tresenje kamere, off by default since 2. 11. 2026), as when the references were recorded: its jitter
// draws from Math.random, which the seeded run shares with the race, so with it off the race goes otherwise and the six samples fall
// elsewhere on the lap (the jitter itself adds no draw call); tools/obremenitev.mjs the same. And the knocks between cars as when the
// references were recorded (Trki med avti: Stara, crV 4; the default since 2. 11. 2026 is Simulacija): the knock moves the cars otherwise,
// so where the six samples fall and how many rivals are in view there goes with it (the cost of a car is the same in every version; on the
// Nordschleife the busiest sample took 361k vertices against 354k, the fleet's heaviest one-make fields 430k against 402k: where the cars
// were, not what they cost). tests/browser/fleet.test.mjs, which measures its fields against these references, the same
const SHAKE = { camShake: 1, camLand: 1, camKerb: 1, camMis: 1, crV: 4 };
// the new map (NEW VERSION · TEST 1, the title's button in the new menu): built and merged, the game stood still, the car put at each
// place, the camera behind it; the busiest frame is checked as a track's is
async function newMap() {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', detail: 'low', shadows: 1, camera: 'chase', zoom: 1.2, ...SHAKE }, { width: 844, height: 390 }, { seed: 12345, menu: true });
  await page.evaluate(() => {
    window.__gl = { calls: 0, verts: 0 };
    const gl = document.querySelector('canvas').getContext('webgl2') || document.querySelector('canvas').getContext('webgl');
    const P = Object.getPrototypeOf(gl), wrap = (name, count) => { const f = P[name]; if (!f) return; P[name] = function (...a) { window.__gl.calls++; window.__gl.verts += count(a); return f.apply(this, a); }; };
    wrap('drawElements', a => a[1]); wrap('drawArrays', a => a[2]); wrap('drawElementsInstanced', a => a[1] * a[4]); wrap('drawArraysInstanced', a => a[2] * a[3]);
  });
  await page.waitForFunction(() => window.Menu && Menu.ready && document.getElementById('menu-host').shadowRoot.querySelector('#s-title'), null, { timeout: 120000 });
  await tapNewVersion(page);
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
const WRAP = () => {
  window.__gl = { calls: 0, verts: 0 };
  const gl = Render.info && document.querySelector('canvas').getContext('webgl2') || document.querySelector('canvas').getContext('webgl');
  const P = Object.getPrototypeOf(gl), wrap = (name, count) => { const f = P[name]; if (!f) return; P[name] = function (...a) { window.__gl.calls++; window.__gl.verts += count(a); return f.apply(this, a); }; };
  wrap('drawElements', a => a[1]); wrap('drawArrays', a => a[2]);
  wrap('drawElementsInstanced', a => a[1] * a[4]); wrap('drawArraysInstanced', a => a[2] * a[3]);
};
// one track's samples (the race just started on it): the gate's and the H0 report's (--h0) the same
const SAMPLE = async () => {
  if (Render.world.landmarkLoad) await Render.world.landmarkLoad;   // (a landmark made in Blender, js/znamenitost.js: its model loaded first, else the counts depend on how fast it came: El Jem 316k with the fallback, 376k with the model)
  // a fresh race with Math.random seeded, paused at once: nothing moves by itself, the race is stepped and drawn only
  // here, in one go, so the counts are the same every run
  const g = window.__game; let seed = 12345; Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  g.onAction('restart'); g.pause();
  g.race.lch = null; for (const c of g.race.cars) c.lch = null;   // (the start's reaction off: the samples measure what is drawn, at the same spots on the lap as ever)
  g.race.player.kt = null;   // (the player's own tyres too, Car.kt, every vehicle's since 1. 11. 2026: their wear changes the grip and so the car's way round the lap)
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
};
// H0 (docs/grafika-aaa.md, »Vrata in povečava«): the gate above measures NIZKA at zoom 1.2 on a phone held sideways; the game's default zoom
// is 1.4 (DEF.zoom, js/game.js) and a phone is held upright too. --h0 measures the same way (the same counter over every WebGL draw, the
// rivals on the track, the same six places) at zoom 1.4: NIZKA sideways and upright, SREDNJA, VISOKA, and writes tests/golden/perf-h0.json.
// A report only: no check reads it, the gate and tests/golden/perf.json stay as they are, --update (npm run golden:update) does not write it.
//   node tests/browser/perf.test.mjs --h0                                   every track, every row of H0_ROWS
//   H0_ONLY=nizka,nizka-pokoncno PERF_ONLY=spa,killar node ... --h0         only these rows / tracks (the others' values kept)
//   H0_OUT=/tmp/a.json                                                      written there instead (rows measured side by side, joined after)
// (h7: the fitted shadow box on SREDNJA and VISOKA, Render.ext.senca of js/render-senca.js: 0 off, today's box, measured without the
// module too; 1 on, measured only where the module is loaded)
const H0_FILE = path.join(REPO, 'tests', 'golden', 'perf-h0.json'), H0_ZOOM = 1.4;
const H0_ROWS = {
  'nizka': { detail: 'low', quality: 'normal', vp: [844, 390] },
  'nizka-pokoncno': { detail: 'low', quality: 'normal', vp: [390, 844] },
  'srednja': { detail: 'med', quality: 'normal', vp: [844, 390], h7: 0 },
  'srednja-h7': { detail: 'med', quality: 'normal', vp: [844, 390], h7: 1 },
  'visoka': { detail: 'high', quality: 'high', vp: [1600, 900], h7: 0 },
  'visoka-h7': { detail: 'high', quality: 'high', vp: [1600, 900], h7: 1 },
};
async function h0() {
  const file = process.env.H0_OUT || H0_FILE, rep = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  const rows = process.env.H0_ONLY ? process.env.H0_ONLY.split(',') : Object.keys(H0_ROWS);
  rep.kako = `tests/browser/perf.test.mjs --h0: povečava ${H0_ZOOM}, kamera za avtom, sence, nasprotniki, števec nad vsemi klici WebGL, največ in povprečje šestih mest kroga; poročilo, ne vrata`;
  for (const key of rows) {
    const R = H0_ROWS[key]; if (!R) throw new Error('no H0 row ' + key);
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { quality: R.quality, detail: R.detail, shadows: 1, camera: 'chase', zoom: H0_ZOOM, ...SHAKE }, { width: R.vp[0], height: R.vp[1] }, { seed: 12345 });
    await page.evaluate(WRAP);
    if (R.h7 != null && !(await page.evaluate((on) => { const s = Render.ext.senca; if (!s || !s.debug) return !on; s.debug.fit = on; return true; }, R.h7))) { console.log(`${key}: skipped (no Render.ext.senca)`); await ctx.close(); continue; }
    const ids = await trackIds(page), row = rep[key] && rep[key].proge || {};
    for (const id of ids) {
      if (only && !only.includes(id)) continue;
      await startTrack(page, id);
      const r = await page.evaluate(SAMPLE); delete r.jsMs; row[id] = r;
      console.log(`${key.padEnd(15)} ${id.padEnd(12)} calls/frame ${r.calls} (max ${r.maxCalls}), vertices/frame ${r.kverts}k (max ${r.maxKverts}k)${r.maxCalls > 300 || r.maxKverts > 900 ? '  OVER 300 / 900k' : ''}`);
      rep[key] = { stopnja: R.detail, kakovost: R.quality, zaslon: R.vp.join('x'), ...(R.h7 != null ? { h7: R.h7 } : {}), proge: row };
      fs.writeFileSync(file, JSON.stringify(rep, null, 1) + '\n');   // (after every track: a long run cut short keeps what it measured)
    }
    if (errors.length) console.log(`${key}: page errors: ${errors.slice(0, 5).join(' | ')}`);
    await ctx.close();
  }
  for (const key of Object.keys(rep)) { const P = rep[key] && rep[key].proge; if (!P) continue; const over = Object.keys(P).filter(id => P[id].maxCalls > 300 || P[id].maxKverts > 900); console.log(`${key}: over 300 draw calls or 900k vertices at the busiest place: ${over.length ? over.map(id => `${id} (${P[id].maxCalls} / ${P[id].maxKverts}k)`).join(', ') : 'none'}`); }
  console.log('written ' + file);
}
const update = process.argv.includes('--update');
const only = process.env.PERF_ONLY ? process.env.PERF_ONLY.split(',') : null;   // (only these tracks, 'newmap' among them)
const golden = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {};
const T = checker('phone budget (844x390, normal quality, NIZKA detail, shadows)');
const srv = await serve();
const browser = await launch();
const out = {};
if (process.argv.includes('--h0')) { try { await h0(); } finally { await browser.close(); await srv.close(); } process.exit(0); }
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', detail: 'low', shadows: 1, camera: 'chase', zoom: 1.2, ...SHAKE }, { width: 844, height: 390 }, { seed: 12345 });
  await page.evaluate(WRAP);   // count every WebGL draw (all render passes)
  // (Jezero too, a test track trackIds leaves out: tests/browser/fleet.test.mjs reads its budget from here)
  const ids = await trackIds(page); if (!ids.includes('jezero')) ids.unshift('jezero');
  for (const id of ids) {
    if (only && !only.includes(id)) continue;
    await startTrack(page, id);
    const r = await page.evaluate(SAMPLE);
    out[id] = r;
    const g = golden[id], line = `calls/frame ${r.calls} (max ${r.maxCalls}), vertices/frame ${r.kverts}k (max ${r.maxKverts}k), JS ${r.jsMs} ms/frame`;
    if (update) { console.log(`${id.padEnd(10)} ${line}`); continue; }
    if (!g) { T.check(`${id}: within the phone budget`, false, 'no reference'); continue; }
    const why = [];
    if (r.maxCalls > g.maxCalls * 1.1 + 5) why.push(`draw calls ${r.maxCalls} > ${Math.round(g.maxCalls * 1.1 + 5)}`);
    if (r.maxKverts > g.maxKverts * 1.1 + 20) why.push(`vertices ${r.maxKverts}k > ${Math.round(g.maxKverts * 1.1 + 20)}k`);
    if (!(await page.evaluate((id) => !!(Core.TRACKS.find(d => d.id === id) || {}).test, id))) {   // (the budget of CLAUDE.md, on a real track: on average and at its busiest place)
      if (r.calls > 300 || r.kverts > 900) why.push('over the budget of CLAUDE.md (300 draw calls, 900k vertices on average)');
      if (r.maxCalls > 300 || r.maxKverts > 900) why.push('over the budget of CLAUDE.md at the busiest place (300 draw calls, 900k vertices)');
    }
    T.check(`${id}: within the phone budget`, !why.length, line + (why.length ? ' — ' + why.join(', ') : ''));
  }
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
  await ctx.close();   // (the tracks' game closed first: still running beside the new map's, it slowed that one's loading past page.goto's limit)
  if (!only || only.includes('newmap')) await newMap();
} finally {
  await browser.close(); await srv.close();
}
if (update) { fs.writeFileSync(FILE, JSON.stringify(only ? Object.assign({}, golden, out) : out, null, 1) + '\n'); console.log('written ' + FILE); }
else T.done();
