// Luanda: the ground under the fort as the game builds it (the outline from OSM, the heights from the world's groundH), for the model
// in Blender (tools/znamenitost/luanda.py), so its walls stand on the game's own ground.
//   node tools/znamenitost/luanda-tla.mjs <out.json>
import fs from 'node:fs';
import { serve, launch, openGame, startTrack } from '../../tests/browser/lib.mjs';
const out = process.argv[2];
if (!out) { console.error('usage: node tools/znamenitost/luanda-tla.mjs <out.json>'); process.exit(2); }
const srv = await serve(), browser = await launch();
try {
  const { page } = await openGame(browser, srv.base + '/index.html', {}, { width: 480, height: 270 });
  await startTrack(page, 'luanda');
  const r = await page.evaluate(() => {
    const m0 = LU_DATA.marks.find(m => m[1] === 'castle'), u = []; for (let k = 0; k + 1 < m0[4].length; k += 2) u.push([m0[4][k], m0[4][k + 1]]);
    const x0 = Math.min(...u.map(p => p[0])) - 24, x1 = Math.max(...u.map(p => p[0])) + 24, z0 = Math.min(...u.map(p => p[1])) - 24, z1 = Math.max(...u.map(p => p[1])) + 24;
    const st = 1, nx = Math.ceil((x1 - x0) / st) + 1, nz = Math.ceil((z1 - z0) / st) + 1, h = [], g = Render.world.groundH;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) h.push(Math.round(g(x0 + i * st, z0 + j * st) * 100) / 100);
    return { pts: u, FC: Render.world.marks.Trdnjava, x0, z0, st, nx, nz, h };
  });
  fs.writeFileSync(out, JSON.stringify(r));
  console.log('outline', r.pts.length, 'points, grid', r.nx, 'x', r.nz, 'centre', r.FC.map(v => v.toFixed(1)).join(' '), 'ground', Math.min(...r.h), '..', Math.max(...r.h), 'm');
} finally { await browser.close(); await srv.close(); }
