// Maketa ozadja menija (samo maketa, ni del igre): izvozi avto JASTREB 6 iz igre (koren repozitorija) z barvo in številko 1
// v JSON za izris v Blenderju (izris.py). Uporabi maketa-menija/orodja/car_export.js.
// Zagon: node maketa-menija/ozadje-izris/avto.mjs <izhod.json> [barva hex, privzeto d81f2a] [id avta, privzeto jastreb]
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const HERE = path.dirname(new URL(import.meta.url).pathname), GAME = path.join(HERE, '..', '..'), TOOLS = path.join(HERE, '..', 'orodja');
const OUT = process.argv[2], COLOR = parseInt(process.argv[3] || 'd81f2a', 16), ID = process.argv[4] || 'jastreb';
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = p.startsWith('/__proto/') ? path.join(TOOLS, p.slice(9)) : path.join(GAME, p.endsWith('/') ? p + 'index.html' : p);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const browser = await pw.chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 412, height: 915 } })).newPage();
page.on('pageerror', e => console.log('pageerror:', e.message));
const raw = JSON.stringify({ sound: 0, comm: 0, camera: 'chase', quality: 'high', shadows: 1, name: 'Player', track: 'jezero', car: 0, color: 0 });
await page.addInitScript((raw) => { localStorage.setItem('tdgp-defaults-v2', '1'); localStorage.setItem('tdgp-noadapt', '1'); localStorage.setItem('tdgp-settings', raw); }, raw);
await page.goto(`http://127.0.0.1:${server.address().port}/`);
await page.waitForFunction(() => window.__game, null, { timeout: 180000 });
await page.addScriptTag({ url: '/__proto/car_export.js' });
const r = await page.evaluate(([id, col]) => { const i = Core.MODELS.findIndex(m => m.id === id); return window.CAREXP.exportCar(i, [col], 1); }, [ID, COLOR]);
fs.writeFileSync(OUT, JSON.stringify({ id: r.id, name: r.name, box: r.box, meshes: r.meshes, textures: r.textures }));
console.log(r.id, r.name, 'meshes', r.meshes.length, 'box', JSON.stringify(r.box), 'tex', Object.keys(r.textures).length);
await browser.close(); server.close();
