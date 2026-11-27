// Atimpoku: the road over the Adomi bridge as the game builds it (every 2 m: the centre line, its normal, the half-widths and the ground
// under it, from the world's bridgeTool), for the model in Blender (tools/znamenitost/atimpoku.py), so the deck lies under the game's road
// and the piers stand on the game's own ground.
//   node tools/znamenitost/atimpoku-tla.mjs <out.json>
import fs from 'node:fs';
import { serve, launch, openGame, startTrack } from '../../tests/browser/lib.mjs';
const out = process.argv[2];
if (!out) { console.error('usage: node tools/znamenitost/atimpoku-tla.mjs <out.json>'); process.exit(2); }
const srv = await serve(), browser = await launch();
try {
  const { page } = await openGame(browser, srv.base + '/index.html', {}, { width: 480, height: 270 });
  await startTrack(page, 'atimpoku');
  const r = await page.evaluate(() => Render.world.bridgeTool());
  fs.writeFileSync(out, JSON.stringify(r));
  console.log('bridge s', r.s.map(v => v.toFixed(1)).join(' '), '|', r.p.length, 'samples, centre', r.c.map(v => v.toFixed(1)).join(' '));
} finally { await browser.close(); await srv.close(); }
