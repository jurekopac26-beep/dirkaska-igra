// Livingstone: the road over the gorge as the game builds it (the track's samples over the bridge: the centre line, its normals, the deck's
// height, the barriers' offsets, and the game's ground (groundH) under the deck and its ribs), for the model of the bridge in Blender
// (tools/znamenitost/livingstone.py), so the steel stands on the game's own gorge and carries its own road.
//   node tools/znamenitost/livingstone-tla.mjs <out.json>
import fs from 'node:fs';
import { serve, launch, openGame, startTrack } from '../../tests/browser/lib.mjs';
const out = process.argv[2];
if (!out) { console.error('usage: node tools/znamenitost/livingstone-tla.mjs <out.json>'); process.exit(2); }
const srv = await serve(), browser = await launch();
try {
  const { page } = await openGame(browser, srv.base + '/index.html', {}, { width: 480, height: 270 });
  await startTrack(page, 'livingstone');
  const r = await page.evaluate(() => {
    const T = window.__game.race.track, g = Render.world.groundH, [a, b] = T.def.bridges[0];
    const i0 = T.idx(T.startS + a), i1 = T.idx(T.startS + b), ic = Math.round((i0 + i1) / 2), r2 = (v) => Math.round(v * 1000) / 1000;
    const S = [];
    for (let i = i0 - 4; i <= i1 + 4; i++) {
      const gr = []; for (let o = -16; o <= 16; o += 2) gr.push(r2(g(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o)));
      S.push({ i, x: r2(T.px[i]), z: r2(T.pz[i]), nx: r2(T.nx[i]), nz: r2(T.nz[i]), y: r2(T.hy[i]), hd: r2(T.hd[i]), bl: r2(T.bl[i]), br: r2(T.br[i]), w: r2(T.wAt(i)), g: gr });
    }
    return { ds: T.ds, i0, i1, ic, FC: Render.world.marks.Most, S };
  });
  fs.writeFileSync(out, JSON.stringify(r));
  const ys = r.S.map(s => s.y), gs = r.S.flatMap(s => s.g);
  console.log('samples', r.S.length, 'ds', r.ds, 'span', r.i0, '..', r.i1, 'centre', r.FC.map(v => v.toFixed(1)).join(' '), 'deck', Math.min(...ys).toFixed(1), '..', Math.max(...ys).toFixed(1), 'ground', Math.min(...gs).toFixed(1), '..', Math.max(...gs).toFixed(1), 'm');
} finally { await browser.close(); await srv.close(); }
