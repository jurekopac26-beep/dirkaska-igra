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
// And the crowd (#1180), as 'spa101': Spa with 101 cars from the grid, stepped through the start and the jam at the first corner; the
// frame's counts after every second, the cars the physics steps per step and the JavaScript time over the lone car's, against the limits
// written in its entry (crowd() below). Its average is within the budget; the busiest second (the jam) has only its reference's margin.
//   node tests/browser/perf.test.mjs            check
//   node tests/browser/perf.test.mjs --update   write new reference values
//   PERF_ONLY=newmap,toskana node tests/browser/perf.test.mjs [--update]   only these (--update: the others' values kept)
//   PERF_ONLY=spa101 node tests/browser/perf.test.mjs [--update]           only the crowd (about a minute)
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
// the crowd (the big field, #1180): Spa with 100 rivals from the grid, the player 50th of 101 (the game gives a field over 22 cars a flying
// start with the player last; here the standing start in the middle of it, the heaviest there is). The race is stepped second by second
// through the start and the jam at the first corner; after every second a frame is counted and ten render-side updates are timed, and of
// the racing seconds the time of physics+AI and the cars stepped per physics step (Core LOD, Race._lodPlan: about two thirds of the 101).
// Then the same with no rival in the same page: the crowd's JavaScript time over the lone car's (x) is the one measure of time that
// does not go with the machine, so it is checked, with a wide margin (between runs it is 5.1-6.1, and a busy machine spoils it: over the
// limit it is measured again, twice at most, and the lowest counts); the cars per step and the frame's counts repeat to the unit.
// The limits are written into the entry (limits): the tracks' margins for the counts, +5 % +1 car per step, 1.4 times the time
const CROWD_S = 34, CROWD_X = (r) => ({ maxCalls: Math.round(r.maxCalls * 1.1 + 5), maxKverts: Math.round(r.maxKverts * 1.1 + 20), cars: +(r.cars * 1.05 + 1).toFixed(1), x: +(r.x * 1.4).toFixed(2) });
async function crowd() {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', detail: 'low', shadows: 1, camera: 'chase', zoom: 1.2, rivals: 100, ...SHAKE }, { width: 844, height: 390 }, { seed: 12345 });
  await page.evaluate(() => {
    window.__gl = { calls: 0, verts: 0 };
    const gl = document.querySelector('canvas').getContext('webgl2') || document.querySelector('canvas').getContext('webgl');
    const P = Object.getPrototypeOf(gl), wrap = (name, count) => { const f = P[name]; if (!f) return; P[name] = function (...a) { window.__gl.calls++; window.__gl.verts += count(a); return f.apply(this, a); }; };
    wrap('drawElements', a => a[1]); wrap('drawArrays', a => a[2]); wrap('drawElementsInstanced', a => a[1] * a[4]); wrap('drawArraysInstanced', a => a[2] * a[3]);
    const R0 = Core.Race; Core.Race = class extends R0 { constructor(t, o) { super(t, o && o.numAI > 21 ? Object.assign({}, o, { playerGrid: 50, flying: 0 }) : o); } };
    const st = window.__st = { steps: 0, cars: 0 }, step = R0.prototype.step;   // (the cars the step computed: all of them, or the Core LOD's plan)
    R0.prototype.step = function (dt) { step.call(this, dt); st.steps++; const L = this._lod; if (L && L.on) { for (let i = 0; i < this.cars.length; i++) st.cars += L.st[i]; } else st.cars += this.cars.length; };
  });
  await startTrack(page, 'spa');
  const measure = () => page.evaluate(async (S) => {
    if (Render.world.landmarkLoad) await Render.world.landmarkLoad;
    const g = window.__game, st = window.__st;
    const run = (rivals) => {
      let seed = 12345; Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      g.S.rivals = rivals; g.onAction('restart'); g.pause();
      g.race.lch = null; for (const c of g.race.cars) c.lch = null;
      g.race.player.kt = null;
      const P = g.race.player, s = [];
      let tPhys = 0, tRend = 0, steps = 0, cars = 0;
      for (let k = 0; k < S; k++) {
        const racing = g.phase === 'racing', s0 = st.steps, c0 = st.cars;
        let t0 = performance.now(); g.sim(1, true); if (racing) { tPhys += performance.now() - t0; steps += st.steps - s0; cars += st.cars - c0; }
        Render.resetCam(); for (let i = 0; i < 10; i++) Render.frame(1 / 60, 1, P, g.S.camera, {});   // the camera settles
        const c1 = __gl.calls, v1 = __gl.verts; Render.frame(1 / 60, 1, P, g.S.camera, {}); s.push([__gl.calls - c1, __gl.verts - v1]);
        Render.scene.visible = false; t0 = performance.now(); for (let i = 0; i < 10; i++) Render.frame(1 / 60, 1, P, g.S.camera, {}); tRend += performance.now() - t0; Render.scene.visible = true;
      }
      const c = s.map(x => x[0]), v = s.map(x => x[1]);
      return { n: g.race.cars.length, grid: P.grid, state: g.race.state, calls: Math.round(c.reduce((a, b) => a + b) / c.length), maxCalls: Math.max(...c), kverts: Math.round(v.reduce((a, b) => a + b) / v.length / 1000),
        maxKverts: Math.round(Math.max(...v) / 1000), cars: steps ? cars / steps : 0, js: steps ? 2 * tPhys / steps + tRend / (10 * S) : 0 };   // (a frame: two physics steps and one update)
    };
    const A = run(100), B = run(0);
    return { n: A.n, grid: A.grid, state: A.state, n1: B.n, state1: B.state, calls: A.calls, maxCalls: A.maxCalls, kverts: A.kverts, maxKverts: A.maxKverts,
      jsMs: +A.js.toFixed(2), jsMs1: +B.js.toFixed(2), cars: +A.cars.toFixed(1), x: B.js ? +(A.js / B.js).toFixed(2) : 0 };
  }, CROWD_S);
  const r = await measure(), gd = golden.spa101;
  for (let i = 0; i < 2 && !update && gd && gd.limits && r.x > gd.limits.x; i++) { const q = await measure(); if (q.x < r.x) Object.assign(r, { jsMs: q.jsMs, jsMs1: q.jsMs1, x: q.x }); }
  const e = { calls: r.calls, maxCalls: r.maxCalls, kverts: r.kverts, maxKverts: r.maxKverts, jsMs: r.jsMs, jsMs1: r.jsMs1, cars: r.cars, x: r.x };
  out.spa101 = Object.assign(e, { limits: CROWD_X(e) });
  const line =`calls/frame ${r.calls} (max ${r.maxCalls}), vertices/frame ${r.kverts}k (max ${r.maxKverts}k), ${r.cars} cars per physics step, JS ${r.jsMs} ms/frame = ${r.x}x the lone car's ${r.jsMs1} ms`;
  if (update) console.log(`${'spa101'.padEnd(10)} ${line}`);
  else if (!gd || !gd.limits) T.check('spa101: within the phone budget', false, 'no reference');
  else {
    const L = gd.limits, why = [];
    if (r.maxCalls > L.maxCalls) why.push(`draw calls ${r.maxCalls} > ${L.maxCalls}`);
    if (r.maxKverts > L.maxKverts) why.push(`vertices ${r.maxKverts}k > ${L.maxKverts}k`);
    if (r.calls > 300 || r.kverts > 900 || r.maxKverts > 900) why.push('over the budget of CLAUDE.md (300 draw calls on average, 900k vertices)');
    if (r.cars > L.cars) why.push(`cars per physics step ${r.cars} > ${L.cars}`);
    if (r.x > L.x) why.push(`JavaScript time ${r.x}x the lone car's > ${L.x}x`);
    T.check('spa101 (Spa, 101 cars from the grid): within the phone budget and the crowd no slower', !why.length, line + (why.length ? ' — ' + why.join(', ') : ''));
  }
  T.check('spa101: 101 cars racing from the grid, the player 50th; then the car alone', r.n === 101 && r.grid === 50 && r.state === 'racing' && r.n1 === 1 && r.state1 === 'racing' && r.cars > 1 && r.cars < 101,
    `${r.n} cars, grid ${r.grid}, ${r.state}; alone ${r.n1}, ${r.state1}; ${r.cars} cars per step`);
  T.check('spa101: no page errors', !errors.length, errors.slice(0, 5).join(' | '));
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
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', detail: 'low', shadows: 1, camera: 'chase', zoom: 1.2, ...SHAKE }, { width: 844, height: 390 }, { seed: 12345 });
  await page.evaluate(() => {   // count every WebGL draw (all render passes)
    window.__gl = { calls: 0, verts: 0 };
    const gl = Render.info && document.querySelector('canvas').getContext('webgl2') || document.querySelector('canvas').getContext('webgl');
    const P = Object.getPrototypeOf(gl), wrap = (name, count) => { const f = P[name]; if (!f) return; P[name] = function (...a) { window.__gl.calls++; window.__gl.verts += count(a); return f.apply(this, a); }; };
    wrap('drawElements', a => a[1]); wrap('drawArrays', a => a[2]);
    wrap('drawElementsInstanced', a => a[1] * a[4]); wrap('drawArraysInstanced', a => a[2] * a[3]);
  });
  // (Jezero too, a test track trackIds leaves out: tests/browser/fleet.test.mjs reads its budget from here)
  const ids = await trackIds(page); if (!ids.includes('jezero')) ids.unshift('jezero');
  for (const id of ids) {
    if (only && !only.includes(id)) continue;
    await startTrack(page, id);
    const r = await page.evaluate(async () => {
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
    });
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
  if (ids.includes('spa') && (!only || only.includes('spa101'))) await crowd();
} finally {
  await browser.close(); await srv.close();
}
if (update) { fs.writeFileSync(FILE, JSON.stringify(only ? Object.assign({}, golden, out) : out, null, 1) + '\n'); console.log('written ' + FILE); }
else T.done();
