// Local check of the journey on the globe in the menu (the race intro), in real time: a Race tap, then the intro every second.
// and a multiplayer duel. After Race it skips the intro (the drone's shots), waits for the start lights, picks a result, then saves the
// results screen and the screens that follow.
// Usage: node check3.mjs [01-,free-]  (a step whose name contains one of these; a step can need the one before it; env W, H, OUTDIR)
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const HERE = path.dirname(new URL(import.meta.url).pathname), SITE = path.join(HERE, '..'), OUT = path.join(HERE, process.env.OUTDIR || 'shots_jm');
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
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text().slice(0, 200)); });
page.on('requestfailed', r => {   // a video still loading when its screen is left is cut off: not an error
  const t = (r.failure() || {}).errorText || ''; if (!/gstatic/.test(r.url()) && !(/\.webm$/.test(r.url()) && /ABORTED/.test(t))) errors.push('failed: ' + r.url() + ' ' + t);
});
await page.goto(base + '/');
await page.evaluate(() => document.fonts.ready);
const wait = (ms) => page.waitForTimeout(ms);
const click = async (sel) => { await page.click(sel); await wait(350); };
const shot = async (name) => {
  const o = await page.evaluate(() => {
    const out = [], se = document.scrollingElement;
    if (se.scrollWidth > se.clientWidth + 1) out.push('page scrolls sideways ' + se.scrollWidth);
    const app = document.getElementById('app').getBoundingClientRect();
    for (const el of document.querySelectorAll('#app *')) {
      const r = el.getBoundingClientRect(); if (!r.width || getComputedStyle(el).visibility === 'hidden') continue;
      if (el.closest('.scroll, .chips, .dio, .stage, .bgv, .tile .im, .mode .im, .ix-bg, .jlabels')) continue;
      if (r.right > app.right + 1 || r.left < app.left - 1) out.push('outside x: ' + el.tagName + '.' + el.className + ' ' + Math.round(r.left) + '..' + Math.round(r.right));
      if (r.bottom > app.bottom + 1) out.push('below: ' + el.tagName + '.' + el.className + ' ' + Math.round(r.bottom));
    }
    for (const el of document.querySelectorAll('#app h1, #app h2, #app h3, #app b, #app small, #app span, #app button:not(.tile):not(.mode)')) if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflow !== 'visible') out.push('clipped: ' + (el.textContent || '').trim().slice(0, 40));
    return [...new Set(out)].slice(0, 8);
  });
  await page.screenshot({ path: path.join(OUT, name + '.png') });
  console.log(name, o.length ? JSON.stringify(o) : 'ok');
};
const open = async (st, scr, o, ms) => { await page.evaluate(([st, scr, o]) => window.MENU_DEBUG.open(st, scr, o), [st, scr, o || {}]); await wait(ms || 700); };
const [st, trackId, modeId] = (process.argv[2] || 'veteran,vrsic,trial').split(',');
const every = +(process.env.EVERY || 1000), count = +(process.env.COUNT || 14);
await open(st, 'title', { fresh: true }, 1500);
await open(st, 'track', { mode: modeId, trackId }, 1200);
await shot('00-track');
await page.click('[data-act="race-single"]');
const t0 = Date.now(); const names = [];
for (let k = 1; k <= count; k++) {
  const due = t0 + k * every; const now = Date.now(); if (due > now) await wait(due - now);
  const info = await page.evaluate(() => { const h = document.querySelector('.ix-v .hud'); return h ? h.querySelector('b').textContent + ' | ' + h.querySelector('small').textContent : '-'; });
  const nm = String(k).padStart(2, '0') + '-intro-' + ((Date.now() - t0) / 1000).toFixed(1) + 's'; console.log(nm, 'HUD:', info); await shot(nm); names.push(nm);
}
await page.click('.ix-skip'); await wait(1600); await shot('99-lights');
console.log(errors.length ? 'ERRORS:\n' + [...new Set(errors)].join('\n') : 'no console errors');
await browser.close(); server.close();
