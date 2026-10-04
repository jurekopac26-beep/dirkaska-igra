// Mockup only: records the game's title-screen demo race (no menu on top) frame by frame in virtual time and encodes it as WebM.
// Usage: node bgvideo.mjs '[["jezero",7],["ljubljana",7]]' [dpr]
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const HERE = path.dirname(new URL(import.meta.url).pathname), GAME = path.join(HERE, '..', 'game_main'), OUT = path.join(HERE, '..', 'assets', 'video');
fs.mkdirSync(OUT, { recursive: true });
const FF = '/opt/pw-browsers/ffmpeg-1011/ffmpeg-linux';
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = path.join(GAME, p.endsWith('/') ? p + 'index.html' : p);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const JOBS = JSON.parse(process.argv[2] || '[["jezero",7]]'), DPR = +(process.argv[3] || 1.25), FPS = 30, WARM = +(process.argv[4] || 14);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const [track, secs] of JOBS) {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: DPR, isMobile: true, hasTouch: true, colorScheme: 'dark' });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('pageerror:', e.message));
  const raw = JSON.stringify({ sound: 0, comm: 0, camera: 'chase', zoom: 1.2, quality: 'high', shadows: 1, carV: 2, name: 'Player', track, car: 4, color: 2 });
  await page.addInitScript((raw) => {
    localStorage.setItem('tdgp-defaults-v2', '1'); localStorage.setItem('tdgp-noadapt', '1'); localStorage.setItem('tdgp-pikes-w7', '1'); localStorage.setItem('tdgp-settings', raw);
    let vt = 0, q = [];
    performance.now = () => vt;
    window.requestAnimationFrame = (cb) => { q.push(cb); return q.length; };
    window.cancelAnimationFrame = () => {};
    window.__step = (ms) => { vt += ms; const cbs = q; q = []; for (const cb of cbs) { try { cb(vt); } catch (e) { console.error(e); } } };
    window.__pump = setInterval(() => window.__step(1000 / 60), 16);
  }, raw);
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 200 && !(await page.evaluate(() => !!window.__game)); i++) await new Promise(r => setTimeout(r, 500));
  await new Promise(r => setTimeout(r, 2500));
  console.log(track, 'loaded');
  await page.evaluate(() => clearInterval(window.__pump));
  // the game's own invented sponsors: the VOLTEX board (a real brand name) shows PIXEL GAS instead
  await page.evaluate(() => { try { const t = Tex.all().sponsors, c = t.image, x = c.getContext('2d'); x.drawImage(c, 0, 192, 256, 64, 0, 128, 256, 64); t.needsUpdate = true; } catch (e) { console.log('sponsor patch', e.message); } });
  const t0 = Date.now();
  for (let i = 0; i < WARM * 20; i++) { await page.evaluate(() => window.__step(1000 / 20)); if (i % 100 === 0) console.log(track, 'warm', i, ((Date.now() - t0) / 1000).toFixed(0) + ' s'); }
  console.log(track, 'warm-up', ((Date.now() - t0) / 1000).toFixed(0) + ' s');
  const name = path.join(OUT, 'bg-' + track + '.webm');
  const ff = spawn(FF, ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', 'pipe:0', '-c:v', 'libvpx', '-b:v', '2200k', '-crf', '9', '-qmin', '4', '-qmax', '38', '-auto-alt-ref', '0', '-deadline', 'good', '-cpu-used', '1', '-an', name], { stdio: ['pipe', 'ignore', 'pipe'] });
  let err = '', dead = false; ff.stderr.on('data', d => { err += d; }); ff.on('close', () => { dead = true; });
  const t1 = Date.now();
  for (let i = 0; i < secs * FPS; i++) {
    // the frame is read straight from the game's WebGL canvas in the same task it was drawn (no page screenshot, no menu on top)
    const url = await page.evaluate(() => { window.__step(1000 / 30); const cv = [...document.querySelectorAll('canvas')].sort((a, b) => b.width * b.height - a.width * a.height)[0]; return cv.toDataURL('image/jpeg', 0.9); });
    const buf = Buffer.from(url.split(',')[1], 'base64');
    if (dead) { console.log(track, 'ffmpeg exited early', err.slice(-300)); break; }
    if (!ff.stdin.write(buf)) await new Promise(r => { ff.stdin.once('drain', r); ff.once('close', r); });
    if (i === 0) fs.writeFileSync(path.join(OUT, 'poster-' + track + '.jpg'), buf);
  }
  ff.stdin.end();
  const code = await new Promise(r => ff.on('close', r));
  console.log(track, 'frames', secs * FPS, ((Date.now() - t1) / 1000).toFixed(0) + ' s', 'ffmpeg', code, code ? err.slice(-400) : '', fs.existsSync(name) ? (fs.statSync(name).size / 1024).toFixed(0) + ' KB' : '');
  await ctx.close();
}
await browser.close(); server.close();
