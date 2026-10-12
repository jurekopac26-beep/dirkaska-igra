// Mockup only: the maps of the open roads and the rally stages (routemap_page.js in the game's page) -> raw/maps/<name>.png + .json,
// and <name>-rain.png for the same view in the rain. Usage: node routemap.mjs maps.json   (maps.json: [[track, "aerial"|"top", name, options], …])
// The game comes from ../game_vrsic (env GAME: another copy), the branch with the Vršič road.
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const HERE = path.dirname(new URL(import.meta.url).pathname), GAME = process.env.GAME || path.join(HERE, '..', 'game_vrsic'), OUT = path.join(HERE, 'raw', 'maps');
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
const byTrack = new Map(); for (const j of JOBS) { if (!byTrack.has(j[0])) byTrack.set(j[0], []); byTrack.get(j[0]).push(j); }
for (const [track, jobs] of byTrack) {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1, colorScheme: 'dark' });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('pageerror:', e.message));
  page.on('console', m => { if (m.type() === 'error') console.log('console:', m.text().slice(0, 200)); });
  const raw = JSON.stringify({ sound: 0, comm: 0, camera: 'chase', zoom: 1.2, quality: 'high', shadows: 1, carV: 2, name: 'Player', track: 'jezero', car: 0, color: 0 });
  await page.addInitScript((raw) => { localStorage.setItem('tdgp-defaults-v2', '1'); localStorage.setItem('tdgp-noadapt', '1'); localStorage.setItem('tdgp-pikes-w7', '1'); localStorage.setItem('tdgp-settings', raw); }, raw);
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 400 && !(await page.evaluate(() => !!window.__game)); i++) await new Promise(r => setTimeout(r, 500));
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => { window.requestAnimationFrame = () => 0; });   // stop the game loop
  await page.addScriptTag({ url: '/__proto/routemap_page.js' });
  for (const [id, kind, name, opt] of jobs) {
    for (const rain of opt.wet ? [0, 1] : [0]) {
      const t0 = Date.now();
      const r = await page.evaluate(([id, kind, opt]) => { try { return window.RM[kind](id, opt); } catch (e) { return { err: e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' | ') }; } }, [id, kind, Object.assign({}, opt, { rain })]);
      if (r.err) { console.log('error', name, r.err); continue; }
      const nm = name + (rain ? '-rain' : '');
      fs.writeFileSync(path.join(OUT, nm + '.png'), Buffer.from(r.png.split(',')[1], 'base64')); delete r.png;
      if (!rain) fs.writeFileSync(path.join(OUT, name + '.json'), JSON.stringify(r));
      console.log('map', id, kind, nm, ((Date.now() - t0) / 1000).toFixed(1) + ' s', 'points', r.route.length, 'seen', r.vis.filter(Boolean).length);
    }
  }
  await ctx.close();
}
await browser.close(); server.close();
