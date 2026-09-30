// Mockup only: still pictures of the cars (Car3D.snapshot in the mockup page) for the menu's buttons -> raw/carimg/*.png,
// then python3 menuimg.py makes the webp files. Usage: node carimgs.mjs ['[[name, model, colour, angle, elevation?], …]']
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const HERE = path.dirname(new URL(import.meta.url).pathname), SITE = path.join(HERE, '..'), OUT = path.join(HERE, 'raw', 'carimg');
const THREE = path.join(HERE, '..', 'game_main', 'js', 'vendor', 'three.r128.min.js');
fs.mkdirSync(OUT, { recursive: true });
const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.webm': 'video/webm' };
const server = http.createServer((q, r) => { let p = decodeURIComponent(new URL(q.url, 'http://x').pathname); if (p === '/') { r.writeHead(200, { 'Content-Type': 'text/html' }); r.end('<!doctype html><html><body><div id="h" style="width:10px;height:10px"></div><script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script><script src="car3d.js"></script></body></html>'); return; }
  const f = path.join(SITE, p); if (!fs.existsSync(f)) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const c = await b.newContext({ viewport: { width: 400, height: 300 } });
await c.route('https://cdnjs.cloudflare.com/**', r => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(THREE) }));
const pg = await c.newPage(); pg.on('pageerror', e => console.log('pageerror', e.message));
await pg.goto(`http://127.0.0.1:${server.address().port}/`);
const JOBS = process.argv[2] ? JSON.parse(process.argv[2]) : [["kaze","kaze",0,-0.75],["vortex","vortex",5,-0.75],["pico","pico",2,-0.75],["strega","strega",6,-0.75],["rally","rally",0,-0.75],["formula","formula",3,-0.75],["duel_l","kaze",0,-0.62],["duel_r","pico",2,-2.52],["career_car","rally",0,-2.39]];
for (const [name, model, ci, ang, el] of JOBS) {
  const url = await pg.evaluate(([m, ci, a, el]) => window.Car3D.snapshot(m, ci, a, 900, 560, el), [model, ci, ang, el == null ? 12 : el]);
  fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(url.split(',')[1], 'base64'));
  console.log('saved', name);
}
await b.close(); server.close();
