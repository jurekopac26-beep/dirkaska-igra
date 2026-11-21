// Isuna: the ground under the chain bridge as the game builds it (the world's groundH round the bridge's line from OSM, js/world-isuna.js BR),
// for the model in Blender (tools/znamenitost/isuna.py), so its gatehouses stand on the game's own ground and the deck is level with it.
//   node tools/znamenitost/isuna-tla.mjs <out.json>
import fs from 'node:fs';
import { serve, launch, openGame, startTrack } from '../../tests/browser/lib.mjs';
const out = process.argv[2];
if (!out) { console.error('usage: node tools/znamenitost/isuna-tla.mjs <out.json>'); process.exit(2); }
const srv = await serve(), browser = await launch();
try {
  const { page } = await openGame(browser, srv.base + '/index.html', {}, { width: 480, height: 270 });
  await startTrack(page, 'isuna');
  const r = await page.evaluate(() => {
    const [cx, cz] = Render.world.marks.Most, R = 34, st = 1, x0 = Math.round(cx - R), z0 = Math.round(cz - R), nx = 2 * R / st + 1, nz = nx, h = [], g = Render.world.groundH;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) h.push(Math.round(g(x0 + i * st, z0 + j * st) * 100) / 100);
    return { MC: [cx, cz], x0, z0, st, nx, nz, h };
  });
  fs.writeFileSync(out, JSON.stringify(r));
  console.log('grid', r.nx, 'x', r.nz, 'centre', r.MC.map(v => v.toFixed(1)).join(' '), 'ground', Math.min(...r.h), '..', Math.max(...r.h), 'm');
} finally { await browser.close(); await srv.close(); }
