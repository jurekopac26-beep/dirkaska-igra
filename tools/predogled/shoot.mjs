// node tools/predogled/shoot.mjs id1 id2 ...  -> tools/predogled/podatki/out/<id>.png (the preview from the portrait chase camera)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const DIR = dirname(fileURLToPath(import.meta.url));
const ids = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const id of ids) {
  const page = await browser.newPage({ viewport: { width: 720, height: 1280 } });
  page.on('console', m => { if (m.type() === 'error') console.log('  console:', m.text()); });
  await page.route('http://pred.local/**', route => {
    const u = decodeURIComponent(new URL(route.request().url()).pathname).slice(1);
    const p = u === 'three.min.js' ? join(DIR, '..', '..', 'js', 'vendor', 'three.r128.min.js') : /^(scenes|tiles)\//.test(u) ? join(DIR, 'podatki', u) : join(DIR, u);
    if (!existsSync(p)) return route.fulfill({ status: 404, body: 'no' });
    const type = p.endsWith('.js') ? 'text/javascript' : p.endsWith('.json') ? 'application/json' : p.endsWith('.png') ? 'image/png' : 'text/html';
    route.fulfill({ status: 200, body: readFileSync(p), contentType: type });
  });
  const t0 = Date.now();
  await page.goto('http://pred.local/render.html?id=' + id);
  await page.waitForFunction(() => window.__done || window.__err, null, { timeout: 240000 });
  const err = await page.evaluate(() => window.__err);
  if (err) { console.log(id, 'ERROR', err.slice(0, 600)); await page.close(); continue; }
  const info = await page.evaluate(() => window.__info);
  mkdirSync(join(DIR, 'podatki', 'out'), { recursive: true }); await page.locator('canvas').screenshot({ path: join(DIR, 'podatki', 'out', id + '.png') });
  console.log(id, 'ok', ((Date.now() - t0) / 1000).toFixed(1) + 's', JSON.stringify(info));
  await page.close();
}
await browser.close();
