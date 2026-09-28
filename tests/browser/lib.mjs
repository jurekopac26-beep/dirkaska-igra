// Shared helpers for the browser tests (Playwright + headless Chromium with software WebGL).
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

// the game folder under test: the repo itself, or another copy given in GAME_ROOT (e.g. an older version)
export const REPO = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');
export const ROOT = process.env.GAME_ROOT ? path.resolve(process.env.GAME_ROOT) : REPO;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

// a tiny static web server for the repo folder (like GitHub Pages)
export function serve(root = ROOT) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      const file = path.join(root, p === '/' ? 'index.html' : p);
      if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve({ base: `http://127.0.0.1:${server.address().port}`, close: () => new Promise(r => server.close(r)) }));
  });
}

export function launch(extraArgs = []) {
  return chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', ...extraArgs] });
}

// open the game; settings: an object (merged over sound/commentary off), a raw JSON string, or null (a fresh profile)
export async function openGame(browser, address, settings = {}, viewport = { width: 480, height: 270 }, opts = {}) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('requestfailed', r => errors.push('request failed: ' + r.url()));
  const raw = settings === null ? null : typeof settings === 'string' ? settings : JSON.stringify(Object.assign({ sound: 0, comm: 0 }, settings));
  // (tdgp-noadapt: software WebGL is slow, so without it the game would lower the resolution and switch shadows off by itself)
  await page.addInitScript(([raw, adapt]) => { localStorage.setItem('tdgp-defaults-v2', '1'); if (!adapt) localStorage.setItem('tdgp-noadapt', '1'); if (raw !== null) localStorage.setItem('tdgp-settings', raw); }, [raw, !!opts.adaptive]);
  // opts.seed: Math.random becomes a seeded generator (the same AI traffic every run, for measurements)
  if (opts.seed) await page.addInitScript((seed) => { let s = seed; Math.random = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }, opts.seed);
  await page.goto(address);
  await page.waitForFunction(() => window.__game, null, { timeout: 180000 });
  return { ctx, page, errors };
}

// start a race on a track through the menus (like a player would); resolves once the race runs on that track
export function startTrack(page, id) {
  return page.evaluate(async (id) => {
    const g = window.__game, wait = (ms) => new Promise(r => setTimeout(r, ms));
    g.onAction('to-title'); await wait(250); g.onAction('to-track'); await wait(250);
    const card = document.querySelector(`[data-track="${id}"]`); if (!card) throw new Error('no track card ' + id);
    card.click(); await wait(150); g.onAction('start');
    for (let k = 0; k < 1200 && !(g.race && g.race.track.def.id === id); k++) await wait(100);
    if (!(g.race && g.race.track.def.id === id)) throw new Error('race did not start on ' + id);
    await wait(300);
    return true;
  }, id);
}

// the list of tracks shown in the track menu
export function trackIds(page) {
  return page.evaluate(async () => {
    const g = window.__game, wait = (ms) => new Promise(r => setTimeout(r, ms));
    g.onAction('to-title'); await wait(250); g.onAction('to-track'); await wait(350);
    return [...new Set([...document.querySelectorAll('[data-track]')].map(e => e.dataset.track))];
  });
}

// run the race for `sec` seconds of game time on autopilot, rendering a frame after every simulated second
export function simulate(page, sec) {
  return page.evaluate(async (sec) => {
    const g = window.__game; let nan = false;
    for (let i = 0; i < sec; i++) {
      g.sim(1, true); await new Promise(r => requestAnimationFrame(r));
      for (const c of g.race.cars) if (!Number.isFinite(c.x) || !Number.isFinite(c.z) || !Number.isFinite(c.speed)) nan = true;
    }
    return nan;
  }, sec);
}

// a small check list that prints OK/FAIL lines and sets the exit code
export function checker(title) {
  let bad = 0, n = 0;
  console.log('== ' + title);
  return {
    check(name, ok, detail = '') { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); return ok; },
    done() { console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`); process.exitCode = bad ? 1 : 0; return bad; },
  };
}
