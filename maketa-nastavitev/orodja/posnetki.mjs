// Real frames from the game for the pictures over the settings (maketa-nastavitev/settings-real.js): one moment of a race, every option
// of each setting drawn at that same moment. The 3D view is the game's own photo (Render.snapshot, as the pause's Foto: at the phone's
// resolution x2, or for Grafika at the resolution that option really draws at), the HUD the page's own (the 3D canvas hidden,
// transparent). The game's loop draws nothing meanwhile (Render.frame off), so a photo takes under a second in software WebGL. Then a few
// frames of the race going on (the film strip). Then sestavi.py puts the 3D and the HUD together into the mockup's frames.
//   node maketa-nastavitev/orodja/posnetki.mjs <port|land> [track] [sim seconds] [keys]     (playwright as for tests/browser)
import { serve, launch } from '../../tests/browser/lib.mjs';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const [orient, track, simSec, only] = [process.argv[2] || 'port', process.argv[3] || 'riviera', +(process.argv[4] || 18), process.argv[5]];
const port = orient === 'port', OUT = path.join(os.tmpdir(), 'posnetki', `${orient}-${track}`) + '/';   // (then: python3 sestavi.py)
fs.mkdirSync(OUT, { recursive: true });
const BASE = { camera: port ? 'chase' : 'iso', control: 'tilt', zoom: 1.4, carLow: 0, quality: 'high', detail: 'high', shadows: 1, line: 0, tower: 1, notes: 1, autoGas: 0 };
const KEYS = { control: ['buttons', 'wheel', 'tilt'], camera: ['iso', 'chase'], zoom: [1.1, 1.4, 1.7], carLow: [0, 1, 2, 3, 4], quality: ['retro', 'normal', 'high'], shadows: [0, 1], line: [0, 1], tower: [0, 1], autoGas: [0, 1] };
const srv = await serve(); const browser = await launch();
const W = port ? 390 : 844, H = port ? 844 : 390;
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage(); const errors = [];
page.setDefaultTimeout(600000);
page.on('pageerror', e => errors.push('pageerror: ' + e.message)); page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
const settings = Object.assign({ sound: 0, comm: 0, quali: 0, faults: 0, hlv: 0, intro: 2, track, weather: 'dry', tod: 'day', season: 'summer' }, BASE);
// (the same race every time: Math.random seeded, as the tests' opts.seed; the race is then stepped by sim(), not in real time)
await page.addInitScript(() => { let s = 20261006; Math.random = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; });
await page.addInitScript(([raw]) => { localStorage.setItem('tdgp-defaults-v2', '1'); localStorage.setItem('tdgp-defaults-v3', '1'); localStorage.setItem('tdgp-noadapt', '1'); localStorage.setItem('tdgp-settings', raw); localStorage.setItem('tdgp-menu', 'old'); }, [JSON.stringify(settings)]);
const t0 = Date.now(), T = () => ((Date.now() - t0) / 1000).toFixed(1);
await page.goto(srv.base + '/index.html');
await page.waitForFunction(() => window.__game, null, { timeout: 180000 });
await page.evaluate(() => { Render.frame = () => { }; });
await page.evaluate(() => window.__game.onAction('to-title')); await page.waitForTimeout(400);
await page.evaluate(() => window.__game.onAction('to-track')); await page.waitForTimeout(600);
await page.evaluate((id) => document.querySelector(`[data-track="${id}"]`).click(), track); await page.waitForTimeout(300);
await page.evaluate(() => window.__game.onAction('start'));
for (let k = 0; k < 180; k++) { if (await page.evaluate(() => !!(window.__game.race && window.__game.race.track))) break; await page.waitForTimeout(1000); }
await page.waitForTimeout(1500);
console.log('race on', T());
await page.evaluate((s) => window.__game.sim(s, true), simSec);
// (the HUD catches up: position, lap, time, speed. Not by the clock: a few of the game's frames, however long they take while it
// compiles its shaders)
const raf0 = await page.evaluate(() => window.__game.fr.raf);
await page.waitForFunction((n) => window.__game.fr.raf >= n, raf0 + 6, { timeout: 240000, polling: 200 });
await page.evaluate(() => { window.__game.pause(); const st = document.createElement('style'); st.textContent = '#s-pause, #rotate, #toast { display: none !important; }'; document.head.appendChild(st); });
// (as during the race: the touch controls on, no START! sign; the game hides the controls while paused)
const raceLook = () => page.evaluate(() => { document.getElementById('touch').classList.remove('off'); document.getElementById('h-msg').className = ''; });
await raceLook();
const POS = {};
const setOpt = (k, v) => page.evaluate(([k, v]) => { const d = document.createElement('div'); d.className = 'seg'; d.dataset.set = k; const b = document.createElement('button'); b.dataset.v = String(v); d.appendChild(b); document.body.appendChild(d); b.click(); d.remove(); Render.resetCam(); }, [k, v]);
async function shot3d(name, native) {
  const [url, pos] = await page.evaluate(([native, side]) => { const g = window.__game, P = g.race.player; Render.resetCam(); const cv = Render.snapshot(P, g.S.camera, native ? 1 : side);
    const v = new THREE.Vector3(P.x, (P.y || 0) + 0.5, P.z).project(Render.camera);   // (where our car is on the screen: the crops)
    return [cv.toDataURL('image/png'), { x: Math.round((v.x + 1) / 2 * innerWidth), y: Math.round((1 - v.y) / 2 * innerHeight) }]; }, [native, Math.max(W, H) * 2]);
  fs.writeFileSync(OUT + name + '-3d.png', Buffer.from(url.split(',')[1], 'base64')); POS[name] = pos;
}
async function shotHud(name) {
  await raceLook();
  await page.evaluate(() => { const st = document.createElement('style'); st.id = 'hudonly'; st.textContent = '#gl { visibility: hidden !important; } html, body { background: transparent !important; }'; document.head.appendChild(st); });
  await page.waitForTimeout(250);
  await page.screenshot({ path: OUT + name + '-hud.png', omitBackground: true });
  await page.evaluate(() => document.getElementById('hudonly').remove());
}
await shot3d('base', false); await shotHud('base'); console.log('base', T());
for (const [k, vals] of Object.entries(KEYS)) {
  if (only && !only.split(',').includes(k)) continue;
  for (const v of vals) { await setOpt(k, v); await page.waitForTimeout(400); await shot3d(`${k}-${v}`, k === 'quality'); await shotHud(`${k}-${v}`); }
  await setOpt(k, BASE[k]); await page.waitForTimeout(300);
  console.log(k, T());
}
// Samodejni plin with the other two controls too (the pictures show the controls the player has)
if (!only || only.split(',').includes('autoGas')) for (const c of ['buttons', 'wheel']) {
  await setOpt('control', c); for (const v of [0, 1]) { await setOpt('autoGas', v); await page.waitForTimeout(400); await shot3d(`autoGas-${v}-${c}`, false); await shotHud(`autoGas-${v}-${c}`); }
  await setOpt('autoGas', BASE.autoGas); await setOpt('control', BASE.control); await page.waitForTimeout(300);
}
// the race going on: a film strip (the 3D only; the HUD as it was)
if (!only || only.split(',').includes('film')) for (let i = 1; i <= 6; i++) { await page.evaluate(() => window.__game.sim(0.3, true)); await shot3d(`film-${i}`, false); }
console.log('film', T());
const info = await page.evaluate(() => { const g = window.__game, P = g.race.player; return { name: P.name, model: P.M && P.M.id, color: P.color }; });
fs.writeFileSync(OUT + 'meta.json', JSON.stringify({ orient, track, simSec, W, H, info, pos: POS }, null, 1));
console.log(errors.slice(0, 6).join('\n') || 'no errors');
await browser.close(); await srv.close();
