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
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.glb': 'model/gltf-binary', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2' };

// a tiny static web server for the repo folder (like GitHub Pages: a folder address serves its index.html). setOffline(true)
// makes every request fail, as if the phone had no internet. setFail(fn) spoils only the requests fn(req) picks: fn returns
// true (the connection drops), an HTTP status such as 503 (the server has a problem) or 'hang' (no answer ever comes)
export function serve(root = ROOT) {
  return new Promise((resolve) => {
    let offline = false, fail = null;
    const hung = new Set();   // (requests left without an answer; they fail as soon as the setting changes)
    const settle = () => { for (const s of hung) s.destroy(); hung.clear(); };
    const server = http.createServer((req, res) => {
      const f = offline || (fail && fail(req));
      if (f === 'hang') { hung.add(req.socket); return; }
      if (typeof f === 'number') { res.writeHead(f); res.end('server problem'); return; }
      if (f) { req.socket.destroy(); return; }
      const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      const file = path.join(root, p.endsWith('/') ? p + 'index.html' : p);
      if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
      // (a video is asked for by ranges: without them the browser cannot seek in it, nor know its length)
      const size = fs.statSync(file).size, type = TYPES[path.extname(file)] || 'application/octet-stream', m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
      if (req.method === 'HEAD') { res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': size }); res.end(); return; }   // (a HEAD only needs the headers: a cheap existence check, no body)
      if (m && (m[1] || m[2])) {
        const a = m[1] ? +m[1] : Math.max(0, size - +m[2]), b = m[1] && m[2] ? Math.min(size - 1, +m[2]) : size - 1;
        if (a > b || a >= size) { res.writeHead(416, { 'Content-Range': `bytes */${size}` }); res.end(); return; }
        res.writeHead(206, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${a}-${b}/${size}`, 'Content-Length': b - a + 1 });
        fs.createReadStream(file, { start: a, end: b }).pipe(res);
        return;
      }
      res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': size });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve({ base: `http://127.0.0.1:${server.address().port}`, close: () => new Promise(r => { server.close(r); server.closeAllConnections(); }), setOffline: (v) => { settle(); offline = !!v; }, setFail: (fn) => { settle(); fail = fn || null; } }));
  });
}

export function launch(extraArgs = []) {
  return chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', ...extraArgs] });
}

// open the game; settings: an object (merged over sound/commentary off and no qualifying: Start goes straight to the race), a raw JSON
// string, or null (a fresh profile)
export async function openGame(browser, address, settings = {}, viewport = { width: 480, height: 270 }, opts = {}) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('requestfailed', r => errors.push('request failed: ' + r.url()));
  // (the failures off unless a test asks for them: a cut tyre after a knock would change what the other tests see; the best moment's video
  // after a race too: it would play before the results)
  // (carDet normal: the cars as a phone draws them, whatever the test browser's pointer: Nastavitve · Detajli avtov picks Visoki on a computer)
  const raw = settings === null ? null : typeof settings === 'string' ? settings : JSON.stringify(Object.assign({ sound: 0, comm: 0, quali: 0, faults: 0, hlv: 0, carDet: 'normal' }, settings));
  // (tdgp-noadapt: software WebGL is slow, so without it the game would lower the resolution and switch shadows off by itself)
  await page.addInitScript(([raw, adapt]) => { localStorage.setItem('tdgp-defaults-v2', '1'); localStorage.setItem('tdgp-defaults-v3', '1'); if (!adapt) localStorage.setItem('tdgp-noadapt', '1'); if (raw !== null) localStorage.setItem('tdgp-settings', raw); }, [raw, !!opts.adaptive]);
  // opts.seed: Math.random becomes a seeded generator. (The game still runs in real time, so this alone does not make a
  // run repeatable: a test that needs the same result every time also pauses the game and steps it itself.)
  if (opts.seed) await page.addInitScript((seed) => { let s = seed; Math.random = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }, opts.seed);
  // (the old title and track screens, which most tests click through: the new menu, js/menu.js, has its own test, menu.test.mjs: opts.menu)
  if (!opts.menu) await page.addInitScript(() => { try { localStorage.setItem('tdgp-menu', 'old'); } catch (_) { /* no storage */ } });
  if (opts.init) await page.addInitScript(opts.init);   // (a test's own set-up, run before the game's scripts)
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
