// world.barKind(i, side) of the named tracks: how many samples of each kind per side (-1 none, 0 steel rail, 1 concrete or stone wall, 2 tyre wall,
// 3 straw bales, 4 timber fence). The grit dust of a wall strike (js/render.js, collisions 6) is drawn only at kind 1.
//   node tools/trki/barkind.mjs spa,rbring        (no ids: every real track)
import { serve, launch, openGame, startTrack, trackIds } from '../../tests/browser/lib.mjs';
const srv = await serve(), browser = await launch();
let bad = 0;
try {
  const { page } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase', zoom: 1.2 });
  const ids = process.argv[2] ? process.argv[2].split(',') : await trackIds(page);
  for (const id of ids) {
    await startTrack(page, id);
    const r = await page.evaluate(() => { const W = Render.world, T = window.__game.race.track; if (!W.barKind) return null;
      const out = [{}, {}]; let wrong = 0;
      for (let i = 0; i < T.N; i++) for (const s of [0, 1]) { const k = W.barKind(i, s ? 1 : -1); if (![-1, 0, 1, 2, 3, 4].includes(k)) wrong++; out[s][k] = (out[s][k] || 0) + 1; }
      return { N: T.N, left: out[0], right: out[1], wrong }; });
    if (!r || r.wrong) bad++;
    console.log(id.padEnd(16), r ? `N ${r.N}  left ${JSON.stringify(r.left)}  right ${JSON.stringify(r.right)}${r.wrong ? '  WRONG VALUES ' + r.wrong : ''}` : 'NO barKind');
  }
} finally { await browser.close(); srv.close(); }
process.exit(bad ? 1 : 0);
