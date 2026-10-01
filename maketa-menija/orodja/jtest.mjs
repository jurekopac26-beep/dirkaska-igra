// Mockup only: the journey on the globe (site/journey.js) in a headless browser, in virtual time: frames of it at given times, saved as
// pictures of the intro's picture box (412 x 343 CSS px, as on a phone) -> shots_j/<from>-<to>_<t>.png and a sheet of them.
// Usage: node jtest.mjs [from] [to] [times: 0,1,2.5 | all]   (env W, H: the box; ARRIVE=0: without the drone video's arrival)
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const HERE = path.dirname(new URL(import.meta.url).pathname), SITE = path.join(HERE, '..'), OUT = path.join(HERE, process.env.OUTDIR || 'shots_j');
const FONTS = path.join(HERE, 'fonts'), THREE = path.join(HERE, '..', 'game_main', 'js', 'vendor', 'three.r128.min.js');
fs.mkdirSync(OUT, { recursive: true });
const from = process.argv[2] === '-' ? '' : (process.argv[2] || 'pikes'), to = process.argv[3] || 'vrsic', W = +(process.env.W || 412), H = +(process.env.H || 343);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.webm': 'video/webm', '.woff2': 'font/woff2' };
// the drone video's arrival (routes.js has it once routes.py has run; before that the drone render's own file)
const RT = (() => { const f = path.join(HERE, 'raw', 'maps', 'drone-' + to + '.json'); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null; })();
const arrive = process.env.ARRIVE === '0' ? null : (RT && RT.arrive) || (() => { const f = path.join(HERE, 'raw', 'drone', to, 'arrive.json'); return fs.existsSync(f) ? Object.assign({ fps: 30 }, JSON.parse(fs.readFileSync(f, 'utf8'))) : null; })();
const PAGE = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto"><link rel="stylesheet" href="style.css">
<style>html,body{margin:0;background:#05080d;overflow:hidden} #wrap{position:absolute;left:0;top:0;width:${W}px;height:${H}px} .ix-v{aspect-ratio:auto!important;max-height:none!important;min-height:0!important;width:${W}px;height:${H}px}
#line{position:absolute;left:0;top:${H + 6}px;width:${W}px;color:#fff;font:700 italic 14px/1.3 Roboto}</style></head>
<body><div id="wrap"><div class="ix-v jon" id="v"><div class="dio fly"><video muted playsinline preload="auto" src="assets/maps/drone-${to}.webm"></video><div class="hud"><b></b><small></small></div></div></div></div><div id="line"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script><script src="data.js"></script><script src="geo.js"></script><script src="journey.js"></script></body></html>`;
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p === '/' || p === '/__jtest.html') { res.writeHead(200, { 'Content-Type': TYPES['.html'] }); res.end(PAGE); return; }
  const file = p.startsWith('/__fonts/') ? path.join(FONTS, p.slice(9)) : path.join(SITE, p);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  const st = fs.statSync(file), range = req.headers.range, type = TYPES[path.extname(file)] || 'application/octet-stream';
  if (range) { const [a, b] = range.replace('bytes=', '').split('-'); const s = +a, e = b ? +b : st.size - 1; res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${s}-${e}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': e - s + 1 }); fs.createReadStream(file, { start: s, end: e }).pipe(res); return; }
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes' }); fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: W, height: H + 60 }, deviceScaleFactor: 2, colorScheme: 'dark' });
await ctx.route('https://cdnjs.cloudflare.com/**', r => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(THREE) }));
await ctx.route('https://fonts.googleapis.com/**', r => r.fulfill({ contentType: 'text/css', body: fs.readFileSync(path.join(FONTS, 'roboto.css'), 'utf8').replace(/url\((roboto-[^)]+)\)/g, `url(${base}/__fonts/$1)`) }));
await ctx.route('https://fonts.gstatic.com/**', r => r.abort());
await ctx.addInitScript(() => {   // virtual time: the page's clock and its frames move only when told
  let vt = 1000, q = []; const real = performance.now.bind(performance);
  performance.now = () => vt; window.__real = real;
  window.requestAnimationFrame = (cb) => { q.push(cb); return q.length; }; window.cancelAnimationFrame = () => {};
  window.__step = (ms) => { vt += ms; const cbs = q; q = []; for (const cb of cbs) { try { cb(vt); } catch (e) { console.error(e && e.stack || e); } } };
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text().slice(0, 300)); });
await page.goto(base + '/__jtest.html');
await page.evaluate(() => document.fonts.ready);
const info = await page.evaluate(async ([from, to, arrive]) => {
  await Journey.preload([from, to].filter(Boolean));
  const v = document.querySelector('#v'), hb = v.querySelector('.hud b'), hs = v.querySelector('.hud small'), line = document.querySelector('#line'), video = v.querySelector('video');
  window.__hand = -1;
  const nm = (id) => { const t = (window.MENU || {}).tracks; const x = t && t.find(q => q.id === id); return x ? x.name : undefined; };
  const j = Journey.play(v, { from: from || null, to, arrive, video, fromTitle: nm(from), toTitle: nm(to), onHud: (a, b) => { hb.textContent = a; hs.textContent = b; }, onLine: (t) => { line.textContent = t; }, onHandover: () => { window.__hand = performance.now(); } });
  window.__j = j; j.done.then(w => { window.__done = w; });
  return { total: j.total };
}, [from, to, arrive]);
console.log(from, '->', to, 'total', info.total.toFixed(2), 's', arrive ? 'arrival ' + arrive.cam.length + ' frames' : 'no arrival');
// let the pictures reach the GPU (a few frames at t = 0), then step at 30 fps and save the asked times
const want = (process.argv[4] && process.argv[4] !== 'all') ? process.argv[4].split(',').map(Number) : Array.from({ length: Math.ceil((info.total + 0.3) / 0.5) }, (_, i) => i * 0.5);
const shotsDone = []; let t = 0; const dt = 1 / 30;
await page.evaluate(() => window.__step(0));
await page.waitForTimeout(800);
for (const tw of want.sort((a, b) => a - b)) {
  while (t + dt <= tw + 1e-6) { await page.evaluate((ms) => { window.__step(ms); const v = document.querySelector('video'); if (window.__hand > 0 && v) { const ht = (performance.now() - window.__hand) / 1000; if (Math.abs(v.currentTime - ht) > 0.02) v.currentTime = ht; } }, dt * 1000); t += dt; }
  await page.waitForTimeout(60);
  const name = `${from || 'none'}-${to}_${tw.toFixed(1).padStart(4, '0')}`;
  await page.screenshot({ path: path.join(OUT, name + '.png'), clip: { x: 0, y: 0, width: W, height: H + 50 } });
  shotsDone.push(name);
  const st = await page.evaluate(() => ({ done: window.__done || null }));
  if (st.done) { console.log('done at', tw, st.done); break; }
}
console.log('frames', shotsDone.length, errors.length ? 'ERRORS\n' + [...new Set(errors)].join('\n') : 'no errors');
await browser.close(); server.close();
// a sheet: 4 across
const py = `
from PIL import Image, ImageDraw
import sys
names = sys.argv[2:]; ims = [Image.open('${OUT}/' + n + '.png').convert('RGB') for n in names]
w, h = ims[0].size; s = 0.5; W2, H2 = int(w * s), int(h * s); cols = 4; rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (W2 * cols, H2 * rows), (20, 20, 20))
for i, (n, im) in enumerate(zip(names, ims)):
    im = im.resize((W2, H2), Image.LANCZOS); d = ImageDraw.Draw(im); d.text((6, 4), n.split('_')[-1] + ' s', fill=(255, 255, 0)); sheet.paste(im, ((i % cols) * W2, (i // cols) * H2))
sheet.save(sys.argv[1], quality=86)`;
execFileSync('python3', ['-c', py, path.join(OUT, `sheet_${from || 'none'}-${to}.jpg`), ...shotsDone]);
console.log('sheet', path.join(OUT, `sheet_${from || 'none'}-${to}.jpg`));
