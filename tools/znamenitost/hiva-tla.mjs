// Hiva: the ground under the walls of the old town as the game builds them (the walls, towers and gates from OSM in js/data/hiva.js, the
// heights from the world's groundH), for the model in Blender (tools/znamenitost/hiva.py), so its walls stand on the game's own ground.
//   node tools/znamenitost/hiva-tla.mjs <out.json>
import fs from 'node:fs';
import { serve, launch, openGame, startTrack } from '../../tests/browser/lib.mjs';
const out = process.argv[2];
if (!out) { console.error('usage: node tools/znamenitost/hiva-tla.mjs <out.json>'); process.exit(2); }
const srv = await serve(), browser = await launch();
try {
  const { page } = await openGame(browser, srv.base + '/index.html', {}, { width: 480, height: 270 });
  await startTrack(page, 'hiva');
  const r = await page.evaluate(() => {
    const D = HV_DATA, xs = [], zs = [];
    for (const [, fl] of [...D.cwall, ...D.gates]) for (let k = 0; k + 1 < fl.length; k += 2) { xs.push(fl[k]); zs.push(fl[k + 1]); }
    const x0 = Math.floor(Math.min(...xs) - 30), x1 = Math.max(...xs) + 30, z0 = Math.floor(Math.min(...zs) - 30), z1 = Math.max(...zs) + 30;
    const st = 2, nx = Math.ceil((x1 - x0) / st) + 1, nz = Math.ceil((z1 - z0) / st) + 1, h = [], g = Render.world.groundH;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) h.push(Math.round(g(x0 + i * st, z0 + j * st) * 100) / 100);
    return { cwall: D.cwall, towers: D.towers, gates: D.gates, FC: Render.world.marks.Obzidje, x0, z0, st, nx, nz, h };
  });
  fs.writeFileSync(out, JSON.stringify(r));
  console.log('walls', r.cwall.length, 'towers', r.towers.length, 'gates', r.gates.length, 'grid', r.nx, 'x', r.nz, 'centre', r.FC.map(v => v.toFixed(1)).join(' '), 'ground', r.h.reduce((a, b) => Math.min(a, b)), '..', r.h.reduce((a, b) => Math.max(a, b)), 'm');
} finally { await browser.close(); await srv.close(); }
