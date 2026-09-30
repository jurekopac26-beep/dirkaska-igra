// Mockup only: the flyover videos of the open roads and the rally stages (routemap_page.js flyInit / flyFrame in the game's page)
// -> raw/maps/fly-<track>.webm (VP9) + fly-<track>.json (where the start, the finish, the point and the places are in each frame).
// Usage: node flyover.mjs [flyovers.json] [vrsic,pikes]   (the jobs: [[track, {options}], …]; only these tracks). The game comes from ../game_vrsic
// (env GAME: another copy), ffmpeg from imageio-ffmpeg (env FFMPEG: another one).
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const HERE = path.dirname(new URL(import.meta.url).pathname), GAME = process.env.GAME || path.join(HERE, '..', 'game_vrsic'), OUT = path.join(HERE, 'raw', 'maps');
const FF0 = '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2', FF = process.env.FFMPEG || (fs.existsSync(FF0) ? FF0 : 'ffmpeg');
fs.mkdirSync(OUT, { recursive: true });
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = p.startsWith('/__proto/') ? path.join(HERE, p.slice(9)) : path.join(GAME, p.endsWith('/') ? p + 'index.html' : p);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const arg = process.argv[2] || 'flyovers.json', JOBS = (fs.existsSync(arg) ? JSON.parse(fs.readFileSync(arg, 'utf8')) : JSON.parse(arg)).filter(j => !process.argv[3] || process.argv[3].split(',').includes(j[0])), FPS = 20;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const [track, opt] of JOBS) {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('pageerror:', e.message));
  const raw = JSON.stringify({ sound: 0, comm: 0, camera: 'chase', zoom: 1.2, quality: 'high', shadows: 1, carV: 2, name: 'Player', track: 'jezero', car: 0, color: 0 });
  await page.addInitScript((raw) => { localStorage.setItem('tdgp-defaults-v2', '1'); localStorage.setItem('tdgp-noadapt', '1'); localStorage.setItem('tdgp-pikes-w7', '1'); localStorage.setItem('tdgp-settings', raw); }, raw);
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 400 && !(await page.evaluate(() => !!window.__game)); i++) await new Promise(r => setTimeout(r, 500));
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => { window.requestAnimationFrame = () => 0; });   // stop the game loop
  await page.addScriptTag({ url: '/__proto/routemap_page.js' });
  const info = await page.evaluate(([t, o]) => window.RM.flyInit(t, o), [track, opt]);
  const name = path.join(OUT, 'fly-' + track + '.webm');
  const ff = spawn(FF, ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', 'pipe:0', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '36', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', '-pix_fmt', 'yuv420p', '-an', name]);
  let err = '', dead = false; ff.stderr.on('data', d => { err += d; }); ff.on('close', () => { dead = true; });
  const frames = [], t0 = Date.now();
  for (let k = 0; k < info.frames; k++) {
    const r = await page.evaluate((k) => window.RM.flyFrame(k), k);
    const buf = Buffer.from(r.jpg.split(',')[1], 'base64');
    if (k === 0) fs.writeFileSync(path.join(OUT, 'fly-' + track + '-poster.jpg'), buf);
    if (dead) { console.log(track, 'ffmpeg exited early', err.slice(-300)); break; }
    if (!ff.stdin.write(buf)) await new Promise(res => { ff.stdin.once('drain', res); ff.once('close', res); });
    delete r.jpg; frames.push([r.d, r.s, r.f, r.p, r.q]);
    if (k % 40 === 0) console.log(track, 'frame', k, ((Date.now() - t0) / 1000).toFixed(0) + ' s');
  }
  ff.stdin.end();
  const code = await new Promise(r => { if (dead) r(0); else ff.on('close', r); });
  fs.writeFileSync(path.join(OUT, 'fly-' + track + '.json'), JSON.stringify({ fps: FPS, W: opt.W || 824, H: opt.H || 560, raceLen: info.raceLen, places: (opt.places || []).map(q => q.n), frames }));
  console.log(track, 'done', ((Date.now() - t0) / 1000).toFixed(0) + ' s', 'ffmpeg', code, code ? err.slice(-300) : '', fs.existsSync(name) ? (fs.statSync(name).size / 1024).toFixed(0) + ' KB' : '');
  await ctx.close();
}
await browser.close(); server.close();
