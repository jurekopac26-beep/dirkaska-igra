// Mockup only: exports the game's showroom cars (from the exported copy of main in ../game_main) as compact JSON for the menu mockup.
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const HERE = path.dirname(new URL(import.meta.url).pathname), GAME = path.join(HERE, '..', 'game_main'), OUT = path.join(HERE, '..', 'assets', 'cars');
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
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1, colorScheme: 'dark' });
const page = await ctx.newPage();
page.on('pageerror', e => console.log('pageerror:', e.message));
const raw = JSON.stringify({ sound: 0, comm: 0, camera: 'chase', zoom: 1.2, quality: 'high', shadows: 1, carV: 2, name: 'Player', track: 'jezero', car: 0, color: 0 });
await page.addInitScript((raw) => { localStorage.setItem('tdgp-defaults-v2', '1'); localStorage.setItem('tdgp-noadapt', '1'); localStorage.setItem('tdgp-settings', raw); }, raw);
await page.goto(base + '/');
await page.waitForFunction(() => window.__game, null, { timeout: 180000 });
await page.addScriptTag({ url: '/__proto/car_export.js' });
const models = await page.evaluate(() => Core.MODELS.map((m, i) => ({ i, id: m.id, name: m.name, glb: m.glb || null, num: m.num || 1 })));
console.log(models.map(m => m.id + (m.glb ? '(glb)' : '')).join(' '));
const PALETTE = [0xd81f2a, 0xf5f5f0, 0x1c5fd6, 0xf2c230, 0x1a1a1f, 0x2fa84f, 0xff7a1a, 0x8e3bd6];
const pack = (arr, T) => arr ? Buffer.from(new T(arr).buffer).toString('base64') : undefined;
for (const m of models) {
  if (m.glb) continue;
  const t0 = Date.now();
  const r = await page.evaluate(([i, pal, num]) => window.CAREXP.exportCar(i, pal, num), [m.i, PALETTE, m.num]);
  let nv = 0;
  const meshes = r.meshes.map(e => {
    nv += e.pos.length / 3;
    const big = e.idx && Math.max(...e.idx) > 65535;
    return { name: e.name, ro: e.ro, mats: e.mats, groups: e.groups, pos: pack(e.pos, Float32Array), nrm: pack(e.nrm, Int8Array), col: pack(e.col, Uint8Array), uv: pack(e.uv, Float32Array), idx: e.idx ? pack(e.idx, big ? Uint32Array : Uint16Array) : undefined, idx32: big || undefined };
  });
  const variants = r.variants.map(v => {
    if (!v) return null;
    if (v.full) return { full: true };
    const o = {};
    for (const [k, d] of Object.entries(v)) {
      o[k] = {};
      if (d.col) { const ix = [], c = []; for (let j = 0; j < d.col.length; j += 4) { ix.push(d.col[j]); c.push(d.col[j + 1], d.col[j + 2], d.col[j + 3]); } o[k].ix = pack(ix, Uint32Array); o[k].c = pack(c, Uint8Array); }
      if (d.colFull) o[k].colFull = pack(d.colFull, Uint8Array);
      if (d.mats) o[k].mats = d.mats;
    }
    return o;
  });
  const out = { id: r.id, name: r.name, drive: r.drive, box: r.box, palette: PALETTE, meshes, textures: r.textures, variants };
  const json = JSON.stringify(out);
  fs.writeFileSync(path.join(OUT, r.id + '.json'), json);
  console.log(r.id, 'meshes', meshes.length, 'verts', nv, 'variants', variants.map(v => v ? (v.full ? 'FULL' : Object.keys(v).length) : '-').join(','), 'tex', Object.keys(r.textures).length, (json.length / 1024).toFixed(0) + ' KB', (Date.now() - t0) + ' ms');
}
await browser.close(); server.close();
