// Mockup only: renders each track of the latest game (../game_main) as a floating diorama (transparent PNG) for the menu mockup.
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const HERE = path.dirname(new URL(import.meta.url).pathname), GAME = path.join(HERE, '..', 'game_main'), OUT = path.join(HERE, 'raw', 'tracks');
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
const JOBS = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const [id, name, opt] of JOBS) {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, colorScheme: 'dark' });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('pageerror:', e.message));
  page.on('console', m => { if (m.type() === 'error') console.log('console:', m.text().slice(0, 200)); });
  const raw = JSON.stringify({ sound: 0, comm: 0, camera: 'chase', zoom: 1.2, quality: 'high', shadows: 1, carV: 2, name: 'Player', track: 'jezero', car: 0, color: 0 });
  await page.addInitScript((raw) => { localStorage.setItem('tdgp-defaults-v2', '1'); localStorage.setItem('tdgp-noadapt', '1'); localStorage.setItem('tdgp-pikes-w7', '1'); localStorage.setItem('tdgp-settings', raw); }, raw);
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 400 && !(await page.evaluate(() => !!window.__game)); i++) await new Promise(r => setTimeout(r, 500));
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => { window.requestAnimationFrame = () => 0; });   // stop the game loop
  await page.addScriptTag({ url: '/__proto/dio_page2.js' });
  const t0 = Date.now();
  const r = await page.evaluate(([id, opt]) => { try { return window.DIO.shot3(id, opt); } catch (e) { return { err: e.message + ' ' + (e.stack || '').split('\n')[1] }; } }, [id, opt]);
  if (r && r.png) { fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(r.png.split(',')[1], 'base64')); delete r.png; }
  console.log('render', id, name, ((Date.now() - t0) / 1000).toFixed(1) + ' s', JSON.stringify(r));
  await ctx.close();
}
await browser.close(); server.close();
