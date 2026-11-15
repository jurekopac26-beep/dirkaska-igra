// Realizem G, Štajerska: the game's centre line and def.lc's classes (nrLC) for tools/rbring/meritev.py
import fs from 'node:fs';
import { serve, launch, openGame, startTrack } from '../../tests/browser/lib.mjs';
const srv = await serve(); const browser = await launch();
try {
  const { page } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase', zoom: 1.2 });
  await startTrack(page, 'rbring');
  const d = await page.evaluate(() => {
    const T = window.__game.race.track, def = T.def;
    const line = []; for (let i = 0; i < T.N; i++) line.push([+T.px[i].toFixed(2), +T.pz[i].toFixed(2)]);
    const g = { x0: def.lc.x0, z0: def.lc.z0, nx: def.lc.nx, nz: def.lc.nz, cell: def.lc.cell };
    const cls = []; for (let j = 0; j < g.nz; j++) for (let i = 0; i < g.nx; i++) { const x = g.x0 + (i + 0.5) * g.cell, z = g.z0 + (j + 0.5) * g.cell; cls.push(World.api.nrLC(x, z)); }
    return { N: T.N, len: T.len, ds: T.ds, startS: T.startS || 0, line, lc: g, cls, test: !!def.test, pending: !!def.pending, rast: !!(Render.world && Render.world.rastje) };
  });
  fs.writeFileSync(process.argv[2], JSON.stringify(d));
  console.log('N', d.N, 'len', d.len, 'lc', d.lc, 'test', d.test, d.pending, 'clsN', d.cls.length);
} finally { await browser.close(); srv.close && srv.close(); }
