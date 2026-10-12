// Local check of the race intro on a stepped clock (Playwright's): the globe's journey at exact times, then the video in real time.
// Usage: node ixclock.mjs veteran,vrsic,trial   (a state, a track, a mode) -> shots_ixc/ (env W, H: the screen; LAST: the last race's
// track, where the journey starts; INTRO 0/1/2: Full/Short/Off; WX: the weather; AT: the globe's times in s; REAL: then seconds of video)
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const HERE = path.dirname(new URL(import.meta.url).pathname), SITE = path.join(HERE, '..'), OUT = path.join(HERE, process.env.OUTDIR || 'shots_ixc');
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
await page.clock.install();
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text().slice(0, 200)); });
page.on('requestfailed', r => {   // a video or a sound still loading when its screen is left is cut off: not an error
  const t = (r.failure() || {}).errorText || ''; if (!/gstatic/.test(r.url()) && !(/\.(webm|mp3)$/.test(r.url()) && /ABORTED/.test(t))) errors.push('failed: ' + r.url() + ' ' + t);
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
      if (el.closest('.scroll, .chips, .dio, .stage, .bgv, .tile .im, .mode .im, .ix-bg, .jlabels, .ix-stage')) continue;
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
if (process.env.INTRO) await page.evaluate((v) => { try { localStorage.setItem('apex-mockup-set-intro', v); } catch (_) {} }, process.env.INTRO);
await page.reload(); await page.evaluate(() => document.fonts.ready);
await open(st, 'title', { fresh: true }, 1500);
await open(st, 'track', Object.assign({ mode: modeId, trackId, mapV: +(process.env.MAPV || 2) }, process.env.LAST != null ? { lastTrack: process.env.LAST } : {}, process.env.WX != null ? { weather: +process.env.WX } : {}), 1500);
await shot('00-track');
for (let k = 0; k < 5; k++) { try { const fnow = await page.evaluate(() => Date.now()); await page.clock.pauseAt(fnow + 400); break; } catch (e) { if (k === 4) throw e; } }
await page.click('[data-act="race-single"]', { noWaitAfter: true });
// wait for the journey to start (its pictures load in real time; its frames run on the stepped clock)
let el = 0;
for (let i = 0; i < (process.env.INTRO === '1' || process.env.INTRO === '2' ? 0 : 400); i++) { await page.clock.runFor(17); await page.waitForTimeout(50); el = await page.evaluate(() => { const J = window.__ixDebug && window.__ixDebug.J; return J ? J.elapsed : -1; }); if (el > 0) break; }
const tot = await page.evaluate(() => { const J = window.__ixDebug && window.__ixDebug.J; return J ? { total: J.total, hand: J.hand } : null; });
console.log('journey started', el.toFixed(3), JSON.stringify(tot));
const info = () => page.evaluate(() => {
  const d = window.__ixDebug || {}, s = document.querySelector('.ix-summit');
  const vis = (sel) => [...document.querySelectorAll(sel)].filter(e => +e.style.opacity > 0.3).map(e => { const r = e.getBoundingClientRect(); return e.textContent.replace(/\s+/g, ' ').trim().slice(0, 26) + '@' + Math.round(r.left) + ',' + Math.round(r.top) + ' a' + (+e.style.opacity).toFixed(2); });
  const m = document.querySelector('.ixmap');
  return { J: d.J ? d.J.elapsed.toFixed(2) : '-', summit: s && s.classList.contains('on') ? s.textContent : '', jl: vis('.jl'), pins: vis('.ixpin'), map: m ? (m.style.visibility === 'hidden' ? 'hidden' : 'op' + (m.style.opacity || '1')) : '-', v: d.v ? (d.v.paused ? 'paused' : 'play') + '@' + d.v.currentTime.toFixed(2) : '-' };
});
const AT = (process.env.AT || '0,0.4,0.7,0.9,1.1,1.3,1.6,2,2.5,3,3.5,4,4.5,5,5.5,6,6.5,7,7.5,8,8.5,9,9.5,10,10.5,11').split(',').map(Number);
for (const a of AT) {
  if (!(await page.evaluate(() => !!(window.__ixDebug && window.__ixDebug.J)))) break;
  let cur = await page.evaluate(() => window.__ixDebug.J.elapsed);
  while (cur < a - 0.001) {
    const ms = Math.min(100, (a - cur) * 1000); await page.clock.runFor(Math.max(1, Math.round(ms))); await page.waitForTimeout(25);
    // (HANDSYNC: from the hand-over on, the video held at the stepped clock's time, so its picture and the globe's agree)
    if (process.env.HANDSYNC) await page.evaluate(() => { const d = window.__ixDebug, J = d && d.J; if (J && d.v && J.elapsed >= J.hand) { d.v.pause(); d.v.currentTime = Math.max(0, J.elapsed - J.hand); } });
    if (process.env.HANDSYNC) await page.waitForTimeout(120);
    cur = await page.evaluate(() => window.__ixDebug.J ? window.__ixDebug.J.elapsed : 99);
  }
  await page.waitForTimeout(150);
  const nm = 'g-' + String(a).replace('.', '_') + 's'; console.log(nm, JSON.stringify(await info())); await shot(nm);
}
await page.clock.resume();
let ri = 0; for (const a of (process.env.REAL || '3,8,14').split(',').map(Number)) { await page.waitForTimeout(a * 1000); const nm = 'r' + (ri++) + '-' + a + 's'; console.log(nm, JSON.stringify(await info())); await shot(nm); }
console.log(errors.length ? 'ERRORS:\n' + [...new Set(errors)].join('\n') : 'no console errors');
await browser.close(); server.close();
