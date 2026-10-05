// Mockup only: each track's centre line from the game itself (Core.Track: x east, z south, y up, metres) every ~10 m, with the race's
// start and finish along it -> raw/geo/<track>-track.json (for placing the tracks on the globe and building the land round them).
// Usage: node geo_tracks.mjs [vrsic,spa]   (the game comes from ../game_vrsic, env GAME: another copy)
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const HERE = path.dirname(new URL(import.meta.url).pathname), GAME = process.env.GAME || path.join(HERE, '..', 'game_vrsic'), OUT = path.join(HERE, 'raw', 'geo');
fs.mkdirSync(OUT, { recursive: true });
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.glb': 'model/gltf-binary' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname), file = path.join(GAME, p.endsWith('/') ? p + 'index.html' : p);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 640, height: 480 } })).newPage();
page.on('pageerror', e => console.log('pageerror:', e.message));
await page.addInitScript(() => { localStorage.setItem('tdgp-defaults-v2', '1'); localStorage.setItem('tdgp-settings', JSON.stringify({ sound: 0, comm: 0, quality: 'low' })); });
await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'domcontentloaded' });
for (let i = 0; i < 300 && !(await page.evaluate(() => !!(window.Core && Core.TRACKS && window.__game))); i++) await new Promise(r => setTimeout(r, 400));
const ids = process.argv[2] ? process.argv[2].split(',') : ['vrsic', 'pikes', 'ouninpohja', 'gora', 'jezero', 'riviera', 'monaco', 'rbring', 'suzuka', 'spa', 'nring'];
for (const id of ids) {
  const r = await page.evaluate((id) => {
    const def = Core.TRACKS.find(d => d.id === id), T = new Core.Track(def), step = Math.max(1, Math.round(10 / T.ds)), P = [];
    for (let i = 0; i < T.N; i += step) P.push([+T.px[i].toFixed(1), +T.pz[i].toFixed(1), +T.hy[i].toFixed(1)]);
    return { id, name: def.name, theme: def.theme, open: !!def.open || T.finishS > T.startS, N: T.N, ds: T.ds, len: T.len, startS: T.startS, finishS: T.finishS, raceLen: T.raceLen || T.len, step: step * T.ds, alt: def.alt || null, pts: P };
  }, id);
  fs.writeFileSync(path.join(OUT, id + '-track.json'), JSON.stringify(r));
  console.log(id, r.name, 'points', r.pts.length, 'len', Math.round(r.len), 'open', r.open, 'alt', JSON.stringify(r.alt));
}
await browser.close(); server.close();
