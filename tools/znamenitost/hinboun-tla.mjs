// Phou Hin Boun: the ground round the stone forest as the game builds it (the world's groundH) and the distance to the road's centre line
// (World.api.nrDist), for the model in Blender (tools/znamenitost/hinboun.py), so its spires stand on the game's own ground, off the road.
//   node tools/znamenitost/hinboun-tla.mjs <out.json>
import fs from 'node:fs';
import { serve, launch, openGame, startTrack } from '../../tests/browser/lib.mjs';
const out = process.argv[2];
if (!out) { console.error('usage: node tools/znamenitost/hinboun-tla.mjs <out.json>'); process.exit(2); }
const srv = await serve(), browser = await launch();
try {
  const { page } = await openGame(browser, srv.base + '/index.html', {}, { width: 480, height: 270 });
  await startTrack(page, 'hinboun');
  const r = await page.evaluate(() => {
    const K = HB_DATA.kras, R = 64, st = 2, x0 = K[0] - R, z0 = K[1] - R, n = Math.round(2 * R / st) + 1, h = [], d = [], g = Render.world.groundH, D = World.api.nrDist;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const x = x0 + i * st, z = z0 + j * st;
      h.push(Math.round(g(x, z) * 100) / 100); d.push(Math.round(D(x, z) * 10) / 10);
    }
    return { K, FC: Render.world.marks['Kamniti gozd'], x0, z0, st, nx: n, nz: n, h, d };
  });
  fs.writeFileSync(out, JSON.stringify(r));
  console.log('grid', r.nx, 'x', r.nz, 'centre', r.FC.map(v => v.toFixed(1)).join(' '), 'ground', Math.min(...r.h), '..', Math.max(...r.h), 'm, road', Math.min(...r.d), '..', Math.max(...r.d), 'm');
} finally { await browser.close(); await srv.close(); }
