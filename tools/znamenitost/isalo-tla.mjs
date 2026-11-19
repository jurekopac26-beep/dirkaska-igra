// Isalo: the ground around the Queen of Isalo as the game builds it (the world's groundH), for the model in Blender
// (tools/znamenitost/isalo.py), so the rock stands on the game's own ground.
//   node tools/znamenitost/isalo-tla.mjs <out.json>
import fs from 'node:fs';
import { serve, launch, openGame, startTrack } from '../../tests/browser/lib.mjs';
const out = process.argv[2];
if (!out) { console.error('usage: node tools/znamenitost/isalo-tla.mjs <out.json>'); process.exit(2); }
const srv = await serve(), browser = await launch();
try {
  const { page } = await openGame(browser, srv.base + '/index.html', {}, { width: 480, height: 270 });
  await startTrack(page, 'isalo');
  const r = await page.evaluate(() => {
    const QC = Render.world.marks['Kraljica Isala'], R = 24, st = 1, x0 = Math.round(QC[0]) - R, z0 = Math.round(QC[1]) - R, nx = 2 * R + 1, nz = 2 * R + 1, h = [], g = Render.world.groundH;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) h.push(Math.round(g(x0 + i * st, z0 + j * st) * 100) / 100);
    return { QC, x0, z0, st, nx, nz, h };
  });
  fs.writeFileSync(out, JSON.stringify(r));
  console.log('grid', r.nx, 'x', r.nz, 'centre', r.QC.map(v => v.toFixed(1)).join(' '), 'ground', Math.min(...r.h), '..', Math.max(...r.h), 'm');
} finally { await browser.close(); await srv.close(); }
