// Local check of the menu mockup (site/): serves it inside the same kind of skeleton the Artifact viewer adds, maps the CDN three.js and
// Google Fonts to local copies, clicks through every screen in every state and saves phone-size screenshots. Usage: node check.mjs [shots]
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const HERE = path.dirname(new URL(import.meta.url).pathname), SITE = path.join(HERE, '..'), OUT = path.join(HERE, process.env.OUTDIR || 'shots');
const FONTS = path.join(HERE, 'fonts'), THREE = path.join(HERE, '..', 'game_main', 'js', 'vendor', 'three.r128.min.js');
fs.mkdirSync(OUT, { recursive: true });
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.webm': 'video/webm', '.woff2': 'font/woff2' };
const SKEL = (body) => '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui;background:#fafaf8}img{max-width:100%}[hidden]{display:none!important}</style></head><body>' + body + '</body></html>';
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
page.on('requestfailed', r => { if (!/gstatic/.test(r.url())) errors.push('failed: ' + r.url()); });
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
      if (el.closest('.scroll, .chips, .dio, .stage, .bgv')) continue;
      if (r.right > app.right + 1 || r.left < app.left - 1) out.push('outside x: ' + el.tagName + '.' + el.className + ' ' + Math.round(r.left) + '..' + Math.round(r.right));
      if (r.bottom > app.bottom + 1) out.push('below: ' + el.tagName + '.' + el.className + ' ' + Math.round(r.bottom));
    }
    for (const el of document.querySelectorAll('#app h1, #app h2, #app h3, #app b, #app small, #app span, #app button')) if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflow !== 'visible') out.push('clipped: ' + (el.textContent || '').trim().slice(0, 40));
    return [...new Set(out)].slice(0, 8);
  });
  await page.screenshot({ path: path.join(OUT, name + '.png') });
  console.log(name, o.length ? JSON.stringify(o) : 'ok');
};
const open = async (st, scr, o, ms) => { await page.evaluate(([st, scr, o]) => window.MENU_DEBUG.open(st, scr, o), [st, scr, o || {}]); await wait(ms || 700); };
const ONLY = process.argv[2] ? process.argv[2].split(',') : null;
const plan = [
  ['free', 'title', {}, 2600], ['free', 'car', { carIdx: 0 }, 2200], ['free', 'car', { carIdx: 3, tab: 'paint' }, 1800], ['free', 'track', { trackIdx: 0 }], ['free', 'track', { trackIdx: 7 }],
  ['free', 'career', {}], ['free', 'series', { seriesId: 'home' }], ['free', 'title', { offer: true }],
  ['full', 'title', {}, 1200], ['full', 'car', { carIdx: 2, tab: 'upg' }, 2000], ['full', 'track', { trackIdx: 3 }], ['full', 'career', {}], ['full', 'series', { seriesId: 'home' }],
  ['veteran', 'title', {}, 1200], ['veteran', 'car', { carIdx: 2, colorIdx: 0 }, 2000], ['veteran', 'car', { carIdx: 5 }, 1800], ['veteran', 'car', { carIdx: 6, colorIdx: 3 }, 2000],
  ['veteran', 'track', { trackIdx: 8 }], ['veteran', 'track', { trackIdx: 9 }], ['veteran', 'career', {}], ['veteran', 'series', { seriesId: 'legends' }], ['veteran', 'series', { seriesId: 'attack' }],
  ['veteran', 'friend', {}], ['veteran', 'board', {}], ['veteran', 'settings', {}],
];
let n = 0;
for (const [st, scr, o, ms] of plan) {
  n++;
  const name = String(n).padStart(2, '0') + '-' + st + '-' + scr + (o.carIdx != null ? '-c' + o.carIdx : '') + (o.trackIdx != null ? '-t' + o.trackIdx : '') + (o.seriesId ? '-' + o.seriesId : '') + (o.tab ? '-' + o.tab : '') + (o.offer ? '-offer' : '');
  if (ONLY && !ONLY.some(x => name.includes(x))) continue;
  await open(st, scr, o, ms);
  if (scr === 'friend') { await click('[data-act="friend:create"]'); }
  await shot(name);
}
if (!ONLY) { await open('veteran', 'track', { trackIdx: 8 }); await click('[data-act="race"]'); await wait(700); await shot('99-loading'); await wait(1800); await shot('99-loading-done'); }
console.log(errors.length ? 'ERRORS:\n' + [...new Set(errors)].join('\n') : 'no console errors');
await browser.close(); server.close();
