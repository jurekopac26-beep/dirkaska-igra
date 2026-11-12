// The crash test's roof from behind (tests/browser/crash.test.mjs, point 10) on its own, about a minute a car instead of the whole test (avti
// na raven KOLIBRIJA, docs/avti-kolibri.md, »Slike in orodje«): the roof's mean / max drop after a light, a medium and a strong knock on the
// tail and a strong one on the nose, each on a repaired car, Razbijanje · nov način on, Normalni; the same check as the test (light <
// medium < strong, the strong one at least min(3 cm, 15 % of rlim), its max under 0.3 m). Where it fails, see where body.crush begins
// against the roof's back edge (SOKOL R in the doc).
//   node tools/avti-kolibri/streha.mjs sokol tornado   (one line per car: OK or FAIL, the drops in metres, rlim, then OK or FAIL n)
import { serve, launch, openGame, startTrack } from '../../tests/browser/lib.mjs';

const ids = process.argv.slice(2);
if (!ids.length) { console.log('node tools/avti-kolibri/streha.mjs <id …>'); process.exit(2); }
const srv = await serve(), browser = await launch();
let bad = 0;
try {
  const base = { quality: 'normal', detail: 'low', shadows: 1, camera: 'chase', zoom: 1.1, damage: 2, weather: 'dry', carV: 3 };
  for (const id of ids) {
    const { page, ctx } = await openGame(browser, srv.base + '/index.html', Object.assign({}, base, { xBody: 1, xGlass: 1, xPaint: 1, xParts: 1, carDet: 'normal', carId: id }), { width: 640, height: 296 }, { seed: 4242 });
    await startTrack(page, 'jezero');
    const r = await page.evaluate(() => {
      const g = window.__game; g.pause(); for (let i = 0; i < 400 && g.race.state !== 'racing'; i++) g.sim(0.05, true); g.sim(6, true);
      const R = g.race, P = R.player;
      for (const c of R.cars) if (c !== P && Math.hypot(c.x - P.x, c.z - P.z) < 25) { c.x -= Math.cos(P.h) * 40; c.z -= Math.sin(P.h) * 40; c.px = c.x; c.pz = c.z; }
      for (const c of R.cars) { c.locked = true; c.vx = 0; c.vz = 0; c.inThr = 0; }
      const fr = (dt) => Render.frame(dt, 1, P, 'chase', {}), me = () => Render.crashInfo().cars.find(q => q.player);
      R.repairCar(P); fr(0.016); fr(0.016);
      const scene = (h) => { R.repairCar(P); fr(0.016); Core.applyDamage(P, h[0], h[1] * P.m.len / 2, h[2] * P.m.wid / 2); fr(0.016);
        for (let k = 0; k < 12; k++) fr(0.05); const x = me(); return { roof: x.roof, rlim: x.rf ? x.rf.rlim : 0 }; };
      return { bl: scene([0.05, -1, 0]), bm: scene([0.15, -1, 0]), bs: scene([0.3, -1, 0]), fs: scene([0.3, 1, 0]) };
    });
    await ctx.close();
    const m = [r.bl, r.bm, r.bs].map(q => q.roof ? q.roof.mean : 0), lim = Math.min(0.03, 0.15 * r.bs.rlim);
    const ok = m[0] > 0 && m[0] < m[1] && m[1] < m[2] && m[2] >= lim && r.bs.roof && r.bs.roof.max < 0.3;
    if (!ok) bad++;
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${id}: from behind ${m.join(' / ')} (max ${r.bs.roof && r.bs.roof.max}, needs ${lim.toFixed(4)}), the nose ${r.fs.roof && r.fs.roof.mean}, rlim ${r.bs.rlim}`);
  }
} finally { await browser.close(); if (srv.close) srv.close(); }
console.log(bad ? `FAIL ${bad}` : 'OK');
process.exit(bad ? 1 : 0);
