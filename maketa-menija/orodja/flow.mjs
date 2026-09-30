// Local check of the menu mockup (the folder above), like check.mjs, but it plays the flows: today's race, career races and a multiplayer
// duel. After Race it picks a finishing place, then saves the results screen and the screens that follow.
// Usage: node flow.mjs [01-,free-]  (a step whose name contains one of these; a step can need the one before it; env W, H, OUTDIR)
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
      if (el.closest('.scroll, .chips, .dio, .stage, .bgv, .tile .im')) continue;
      if (r.right > app.right + 1 || r.left < app.left - 1) out.push('outside x: ' + el.tagName + '.' + el.className + ' ' + Math.round(r.left) + '..' + Math.round(r.right));
      if (r.bottom > app.bottom + 1) out.push('below: ' + el.tagName + '.' + el.className + ' ' + Math.round(r.bottom));
    }
    for (const el of document.querySelectorAll('#app h1, #app h2, #app h3, #app b, #app small, #app span, #app button:not(.tile)')) if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflow !== 'visible') out.push('clipped: ' + (el.textContent || '').trim().slice(0, 40));
    return [...new Set(out)].slice(0, 8);
  });
  await page.screenshot({ path: path.join(OUT, name + '.png') });
  console.log(name, o.length ? JSON.stringify(o) : 'ok');
};
const open = async (st, scr, o, ms) => { await page.evaluate(([st, scr, o]) => window.MENU_DEBUG.open(st, scr, o), [st, scr, o || {}]); await wait(ms || 700); };
const fin = async (kind, res) => { await page.evaluate(([k, r]) => window.MENU_DEBUG.finish(k, r), [kind, res]); await wait(500); };
const ONLY = process.argv[2] ? process.argv[2].split(',') : null;
let n = 0;
const step = async (name, fn) => { n++; const nm = String(n).padStart(2, '0') + '-' + name; if (ONLY && !ONLY.some(x => nm.includes(x))) return; await fn(); await shot(nm); };
await step('free-title', () => open('free', 'title', { fresh: true }, 2600));
await step('free-daily', () => open('free', 'track', { trackIdx: 0 }, 900));
await step('free-picker', async () => { await open('free', 'track', { trackIdx: 0 }); await page.click('[data-act="race-daily"]'); await wait(1700); });
await step('free-daily-result', async () => { await page.click('[data-finish="3"]'); await wait(600); });
await step('free-daily-after', async () => { await page.click('[data-act="res-continue"]'); await wait(700); });
await step('free-title-after', () => open('free', 'title', {}, 900));
await step('free-track-jezero', () => open('free', 'track', { trackIdx: 1 }, 900));
await step('free-pick-car', async () => { await page.click('[data-act="pick-car"]'); await wait(2000); });
await step('free-car-paint', async () => { await page.click('[data-act="car:1"]'); await wait(300); await page.click('[data-act="tab:paint"]'); await wait(300); await page.click('[data-act="color:0"]'); await wait(1500); });
await step('free-car-selected', async () => { await page.click('[data-act="car-select"]'); await wait(700); });
await step('free-weather-sheet', async () => { await page.click('[data-act="pick-weather"]'); await wait(500); await page.click('[data-act="weather:1"]'); await wait(200); await page.click('[data-act="laps:1"]'); await wait(400); });
await step('free-weather-done', async () => { await page.click('.sheet [data-act="close-sheet"]'); await wait(500); });
await step('free-single-result', async () => { await page.click('[data-act="race-single"]'); await wait(1700); await page.click('[data-finish="2"]'); await wait(600); });
await step('free-career', () => open('free', 'career', {}, 800));
await step('free-career-result', () => fin('career', '1'));
await step('free-series-after', async () => { await page.click('[data-act="res-continue"]'); await wait(700); });
await step('free-offer', () => open('free', 'title', { offer: true }, 900));
await step('full-title', () => open('full', 'title', { fresh: true }, 1200));
await step('full-career-r2', async () => { await fin('career', '1'); await page.click('[data-act="res-continue"]'); await wait(300); await fin('career', '2'); });
await step('full-career-r3', async () => { await page.click('[data-act="res-continue"]'); await wait(300); await fin('career', '1'); });
await step('full-career', () => open('full', 'career', {}, 800));
await step('full-multi', () => open('full', 'multi', { mpMode: 'create' }, 800));
await step('full-multi-result', () => fin('multi', '2'));
await step('veteran-title', () => open('veteran', 'title', { fresh: true }, 1200));
await step('veteran-daily', () => open('veteran', 'track', { trackIdx: 0 }, 900));
await step('veteran-career-result', () => fin('career', '1'));
await step('veteran-board-today', () => open('veteran', 'board', { lbTrack: -1 }, 800));
await step('veteran-trial-track', () => open('veteran', 'track', { trackIdx: 10 }, 900));
await step('veteran-trial-picker', async () => { await page.click('[data-act="race-single"]'); await wait(1700); });
console.log(errors.length ? 'ERRORS:\n' + [...new Set(errors)].join('\n') : 'no console errors');
await browser.close(); server.close();
