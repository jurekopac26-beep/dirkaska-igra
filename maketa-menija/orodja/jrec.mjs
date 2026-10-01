// Mockup only: a screen recording of the race intro in the menu (the journey on the globe, then the drone's shots), frame by frame in
// virtual time (the page's clock and frames move only when told; the video is set to its time each frame) -> rec/<name>.mp4
// Usage: node jrec.mjs veteran,vrsic,trial [seconds]   (env W, H: the screen; the state's last race is where the journey starts)
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const HERE = path.dirname(new URL(import.meta.url).pathname), SITE = path.join(HERE, '..'), OUT = path.join(HERE, process.env.OUTDIR || 'rec');
const FONTS = path.join(HERE, 'fonts'), THREE = path.join(HERE, '..', 'game_main', 'js', 'vendor', 'three.r128.min.js');
fs.mkdirSync(OUT, { recursive: true });
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.webm': 'video/webm', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p === '/') { res.writeHead(200, { 'Content-Type': TYPES['.html'] }); res.end(fs.readFileSync(path.join(SITE, 'index.html'), 'utf8')); return; }
  const file = p.startsWith('/__fonts/') ? path.join(FONTS, p.slice(9)) : path.join(SITE, p);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  const st = fs.statSync(file), range = req.headers.range, type = TYPES[path.extname(file)] || 'application/octet-stream';
  if (range) { const [a, b] = range.replace('bytes=', '').split('-'); const s = +a, e = b ? +b : st.size - 1; res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${s}-${e}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': e - s + 1 }); fs.createReadStream(file, { start: s, end: e }).pipe(res); return; }
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes' }); fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const W = +(process.env.W || 412), H = +(process.env.H || 915);
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'dark' });
await ctx.route('https://cdnjs.cloudflare.com/**', r => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(THREE) }));
await ctx.route('https://fonts.googleapis.com/**', r => r.fulfill({ contentType: 'text/css', body: fs.readFileSync(path.join(FONTS, 'roboto.css'), 'utf8').replace(/url\((roboto-[^)]+)\)/g, `url(${base}/__fonts/$1)`) }));
await ctx.route('https://fonts.gstatic.com/**', r => r.abort());
await ctx.addInitScript(() => {
  let vt = 1000, q = []; performance.now = () => vt;
  window.requestAnimationFrame = (cb) => { q.push(cb); return q.length; }; window.cancelAnimationFrame = () => {};
  window.__step = (ms) => { vt += ms; const cbs = q; q = []; for (const cb of cbs) { try { cb(vt); } catch (e) { console.error(e && e.stack || e); } } };
  window.__pump = setInterval(() => window.__step(1000 / 60), 16);   // (the menu runs on its own until the recording starts)
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.type() + ': ' + m.text().slice(0, 200)); });
await page.goto(base + '/');
await page.evaluate(() => document.fonts.ready);
await page.addStyleTag({ content: '#mockbar, #mockdot { display: none !important; } .ix-skip:focus { outline: none !important; }' });   // (the mockup's own bar is not part of the menu)
const [st, trackId, modeId] = (process.argv[2] || 'veteran,vrsic,trial').split(','), secs = +(process.argv[3] || 17), fps = 30;
await page.evaluate(([st, trackId, modeId]) => { window.MENU_DEBUG.open(st, 'title', { fresh: true }); window.MENU_DEBUG.open(st, 'track', { mode: modeId, trackId }); }, [st, trackId, modeId]);
await page.waitForTimeout(2500);
await page.evaluate(() => { clearInterval(window.__pump); document.querySelector('[data-act="race-single"]').click(); window.__step(0); });
await page.waitForTimeout(1500);   // (the globe's pictures on the GPU)
const dir = path.join(OUT, 'f'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
let hand = -1;
for (let k = 0; k < secs * fps; k++) {
  await page.evaluate(async (ms) => {
    window.__step(ms); const v = document.querySelector('.intro video'); if (!v) return;
    if (!v.paused) { v.pause(); window.__vt0 = window.__vt0 || performance.now(); }   // (it plays from the hand-over: here it is set to its time each frame)
    if (window.__vt0) { const want = (performance.now() - window.__vt0) / 1000; if (Math.abs(v.currentTime - want) > 0.004) { v.currentTime = want; await new Promise(r => { const f = () => { v.removeEventListener('seeked', f); r(); }; v.addEventListener('seeked', f); setTimeout(r, 400); }); } }
  }, 1000 / fps);
  await page.screenshot({ path: path.join(dir, String(k).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 90 });
  if (k % 30 === 0) console.log('frame', k, 'of', secs * fps);
}
console.log(errors.length ? 'ERRORS:\n' + [...new Set(errors)].join('\n') : 'no errors');
await browser.close(); server.close();
const FF = '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2', name = path.join(OUT, (process.env.NAME || trackId) + '.mp4');
const { spawnSync } = await import('node:child_process');
const r = spawnSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', String(fps), '-i', path.join(dir, '%04d.jpg'), '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p', '-c:v', 'libx264', '-crf', '20', '-preset', 'slow', '-movflags', '+faststart', name], { stdio: 'inherit' });
console.log('video', name, r.status, fs.existsSync(name) ? Math.round(fs.statSync(name).size / 1024) + ' KB' : '');
