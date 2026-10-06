// A real clip from the game for the picture over Upravljanje (maketa-nastavitev/settings-real.js): the race on Riviera (Math.random seeded,
// as posnetki.mjs), fast-forwarded without drawing to t0 (race time), then the game's own loop run by hand, one frame every 1/fps s
// (requestAnimationFrame queued and called with the clock moved on by exactly 1/fps), the autopilot driving. Each frame: the 3D view as
// the game draws it (the canvas read right after the frame), and the HUD three times, once with each control (Tipke, Volan, Nagib) shown
// in use as the autopilot steers: the arrows pressed, the wheel turned, the tilt bar tilted, the gas and the brake pressed. Then
// video.py puts them together and makes the clips.
//   node maketa-nastavitev/orodja/video.mjs <port|land> [t0 = 56.2] [seconds = 4] [fps = 30] [track = riviera]
import { serve, launch } from '../../tests/browser/lib.mjs';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const [orient, t0, dur, fps, track] = [process.argv[2] || 'port', +(process.argv[3] || 56.2), +(process.argv[4] || 4), +(process.argv[5] || 30), process.argv[6] || 'riviera'];
const port = orient === 'port', OUT = path.join(os.tmpdir(), 'posnetki', `video-${orient}-${track}`) + '/';
fs.mkdirSync(OUT, { recursive: true });
const W = port ? 390 : 844, H = port ? 844 : 390, N = Math.round(dur * fps), MODES = ['buttons', 'wheel', 'tilt'];
const srv = await serve(); const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage(); const errors = [];
page.setDefaultTimeout(600000);
page.on('pageerror', e => errors.push('pageerror: ' + e.message)); page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
// (the same race as posnetki.mjs: the same seed and settings)
await page.addInitScript(() => { let s = 20261006; Math.random = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; });
const settings = { sound: 0, comm: 0, quali: 0, faults: 0, hlv: 0, intro: 2, track, weather: 'dry', tod: 'day', season: 'summer', camera: port ? 'chase' : 'iso', control: 'tilt', zoom: 1.4, carLow: 0, quality: 'high', detail: 'high', shadows: 1, line: 0, tower: 1, notes: 1, autoGas: 0 };
await page.addInitScript(([raw]) => { localStorage.setItem('tdgp-defaults-v2', '1'); localStorage.setItem('tdgp-defaults-v3', '1'); localStorage.setItem('tdgp-noadapt', '1'); localStorage.setItem('tdgp-settings', raw); localStorage.setItem('tdgp-menu', 'old'); }, [JSON.stringify(settings)]);
const T0 = Date.now(), T = () => ((Date.now() - T0) / 1000).toFixed(0) + ' s';
await page.goto(srv.base + '/index.html');
await page.waitForFunction(() => window.__game, null, { timeout: 180000 });
await page.evaluate(() => { window.__rf = Render.frame; Render.frame = () => { }; });
await page.evaluate(() => window.__game.onAction('to-title')); await page.waitForTimeout(400);
await page.evaluate(() => window.__game.onAction('to-track')); await page.waitForTimeout(600);
await page.evaluate((id) => document.querySelector(`[data-track="${id}"]`).click(), track); await page.waitForTimeout(300);
await page.evaluate(() => window.__game.onAction('start'));
for (let k = 0; k < 180; k++) { if (await page.evaluate(() => !!(window.__game.race && window.__game.race.track))) break; await page.waitForTimeout(1000); }
await page.waitForTimeout(1500);
// to t0, a little before (the camera settles), without drawing
const warm = 0.4;
await page.evaluate((T) => { const g = window.__game; while (g.race.time < T) g.sim(0.05, true); }, t0 - warm);
// the game's loop by hand from here: the frame waiting now runs once more, then queues itself
await page.evaluate(() => { window.__q = []; window.requestAnimationFrame = (cb) => { window.__q.push(cb); return 1; }; });
await page.waitForFunction(() => window.__q.length > 0, null, { timeout: 60000, polling: 50 });
await page.evaluate((fps) => {
  Render.frame = window.__rf; window.__game.autoDrive = true; Render.resetCam(); window.__t = performance.now();
  window.__tick = () => { const cbs = window.__q.splice(0); window.__t += 1000 / fps; for (const cb of cbs) cb(window.__t); };
  // (the 3D is read from the canvas; the screenshots are the HUD alone, over nothing; the controls without their 60 ms transition; no
  // message across the middle of the screen, such as another driver's mistake: the clip is about the controls)
  const st = document.createElement('style'); st.textContent = '#gl { visibility: hidden !important; } #rotate, #toast, #s-pause, #h-msg { display: none !important; } html, body { background: transparent !important; } #touch, #touch * { transition: none !important; }';
  document.head.appendChild(st);
}, fps);
for (let i = 0; i < Math.round(warm * fps); i++) await page.evaluate(() => window.__tick());
console.log('ready at race time', await page.evaluate(() => window.__game.race.time.toFixed(2)), T());
// where each control is on the screen, in each layout (fractions of the screen): the thumbs of the mockup go there
const rects = {};
for (const m of MODES) rects[m] = await page.evaluate((m) => {
  const t = document.getElementById('touch'); t.classList.remove('m-buttons', 'm-wheel', 'm-tilt'); t.classList.add('m-' + m);
  const out = {};
  for (const id of ['c-left', 'c-right', 'c-wheel', 'c-gas', 'c-brake', 'c-drift', 'tilt-ind']) {
    const e = document.getElementById(id); if (!e || getComputedStyle(e).display === 'none') continue;
    const b = e.getBoundingClientRect(); out[id.replace(/^c-/, '')] = [b.left / innerWidth, b.top / innerHeight, b.width / innerWidth, b.height / innerHeight].map(v => +v.toFixed(4));
  }
  return out;
}, m);
// the controls as the autopilot uses them: the steering smoothed (the wheel and the phone turn, not jump), the arrows with a little hysteresis
const st = { vs: 0, L: false, R: false }, rec = { steer: [], gas: [], brake: [], left: [], right: [], time: [], speed: [] };
const kA = 1 - Math.exp(-(1 / fps) / 0.07);
for (let i = 0; i < N; i++) {
  const r = await page.evaluate(() => {
    window.__tick();
    const g = window.__game, P = g.race.player, gl = document.getElementById('gl');
    const c = document.createElement('canvas'); c.width = gl.width; c.height = gl.height; c.getContext('2d').drawImage(gl, 0, 0);
    return { img: c.toDataURL('image/jpeg', 0.93), steer: P.inSteer || 0, thr: P.inThr || 0, brk: P.inBrk || 0, t: g.race.time, sp: Math.hypot(P.vx || 0, P.vz || 0) * 3.6 };
  });
  fs.writeFileSync(OUT + `3d-${String(i).padStart(4, '0')}.jpg`, Buffer.from(r.img.split(',')[1], 'base64'));
  st.vs += (r.steer - st.vs) * kA;
  if (!st.L && st.vs < -0.25) st.L = true; else if (st.L && st.vs > -0.12) st.L = false;
  if (!st.R && st.vs > 0.25) st.R = true; else if (st.R && st.vs < 0.12) st.R = false;
  const brake = r.brk > 0.15, gas = !brake && r.thr > 0.5;
  rec.steer.push(+st.vs.toFixed(3)); rec.gas.push(gas ? 1 : 0); rec.brake.push(brake ? 1 : 0); rec.left.push(st.L ? 1 : 0); rec.right.push(st.R ? 1 : 0); rec.time.push(+r.t.toFixed(3)); rec.speed.push(Math.round(r.sp));
  for (const m of MODES) {
    await page.evaluate(([m, s]) => {
      const t = document.getElementById('touch'); t.classList.remove('m-buttons', 'm-wheel', 'm-tilt', 'off'); t.classList.add('m-' + m);
      const on = (id, v) => document.getElementById(id).classList.toggle('on', !!v);
      on('c-left', m === 'buttons' && s.L); on('c-right', m === 'buttons' && s.R); on('c-gas', s.gas); on('c-brake', s.brake); on('c-drift', false);
      document.getElementById('wheel-rot').style.transform = 'rotate(' + (m === 'wheel' ? s.vs * 112 : 0).toFixed(1) + 'deg)';
      document.getElementById('tilt-ind').style.setProperty('--t', (m === 'tilt' ? s.vs * 38 : 0).toFixed(1) + 'deg');
    }, [m, { vs: st.vs, L: st.L, R: st.R, gas, brake }]);
    await page.screenshot({ path: OUT + `hud-${m}-${String(i).padStart(4, '0')}.png`, omitBackground: true });
  }
  if (i % 10 === 0) console.log('frame', i, '/', N, 'race', r.t.toFixed(2), 'steer', st.vs.toFixed(2), T());
}
fs.writeFileSync(OUT + 'meta.json', JSON.stringify({ orient, track, t0, fps, n: N, W, H, rects, rec }, null, 1));
console.log(errors.slice(0, 6).join('\n') || 'no errors', T());
await browser.close(); await srv.close();
