// Special mission 07 · Cisterna (js/missions/m07.js, the kit js/missions/kit.js) in the browser, upright (360 x 640, touch): ?misija=07
// on Sani Pass; the panel (NAGIB, PLJUSKANJE, DO VRHA), no timing tower; the tanker's own body (the car's hidden); a careful driver up the
// hairpins (slow in the bends): done, the tanker leaning in the bends; a second run too fast through them: it rolls over (failed). Back to
// the title: the tanker's body gone, the car's back. No errors on the page.
//   node tests/browser/m07.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('m07');
const srv = await serve();
const browser = await launch();
const ready = (page) => page.waitForFunction(() => window.__game.race && typeof Missions !== 'undefined' && Missions.run && window.__game.phase !== 'none', null, { timeout: 240000 });
const st = (page) => page.evaluate(() => { const g = window.__game, R = g.race, r = Missions.run, m = document.getElementById('mis'), vis = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; };
  return { track: R.track.def.id, run: r && { end: r.end, why: r.why, t: r.t, s: r.P.q.s }, rows: m ? [...m.querySelectorAll('.mis-row')].map(e => e.innerText.replace(/\s+/g, ' ').trim()) : [],
    tower: vis('#tw-strip') || vis('#h-tower'), res: document.getElementById('mis-res') && document.getElementById('mis-res').innerText.replace(/\s+/g, ' ') }; });
// a driver: the autopilot's steering; the speed held under sqrt(al x the radius of the road's tightest bend 0-50 m ahead) and vmax
const drive = (page, maxT, vmax, al) => page.evaluate(([maxT, vmax, al]) => {
  const g = window.__game, r = Missions.run, Tr = g.race.track, t0 = r.t; let lean = 0;
  for (let k = 0; k < 40000 && !r.end && r.t - t0 < maxT; k++) {
    const P = r.P, v = Math.hypot(P.vx, P.vz);
    Core.aiControl(P, g.race, 0.05);
    let kM = 0; for (let u = 0; u <= 40; u += 5) kM = Math.max(kM, Math.abs(r.def.bend(Tr, P.q.s + u)));
    const vT = Math.min(vmax, Math.sqrt(al / Math.max(kM, 1e-4)));
    g.sim(0.05, false, P.inSteer * (P.gear < 0 ? -1 : 1), v < vT ? 1 : 0, v > vT + 0.7 ? Math.min(1, (v - vT) / 3) : 0);
    if (r.skin) lean = Math.max(lean, Math.abs(r.skin.rotation.x));
  }
  return { t: r.t, end: r.end, s: r.P.q.s, lean };
}, [maxT, vmax, al]);
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?misija=07', {}, { width: 360, height: 640 }, { touch: true });
  await ready(page); await page.waitForTimeout(300);
  let s = await st(page);
  T.check('?misija=07: Sani Pass', s.track === 'sani', s.track);
  T.check('the panel: NAGIB 0 %, PLJUSKANJE 0 %, DO VRHA 2,8 km; no timing tower', s.rows[0] === 'NAGIB 0 %' && s.rows[1] === 'PLJUSKANJE 0 %' && s.rows[2] === 'DO VRHA 2,8 km' && !s.tower, JSON.stringify(s.rows));
  const S = await page.evaluate(() => { const r = Missions.run, v = Render.viewOf(r.P); return { skin: !!r.skin && !!r.skin.parent, body: v.body.visible }; });
  T.check('the tanker\'s own body (the car\'s hidden)', S.skin && !S.body, JSON.stringify(S));
  await page.evaluate(() => { const g = window.__game; for (let k = 0; k < 2000 && Missions.run.t < 0.3; k++) g.sim(0.05, false, 0, 0, 0); });
  let d = await drive(page, 590, 12, 2.4);
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('a careful driver up the hairpins: done', s.run.end === 'win' && /MISIJA OPRAVLJENA/.test(s.res), JSON.stringify({ d, run: s.run, res: s.res }));
  T.check('the tanker leaned in the bends; in time with stars to spare (under the 2 stars\' time)', d.lean > 0.04 && s.run.t < 420, JSON.stringify(d));
  await page.click('#mis-res [data-mis="again"]'); await ready(page); await page.waitForTimeout(500);
  d = await drive(page, 400, 13, 6);
  s = await st(page);
  T.check('too fast through the hairpins: the tanker rolls over (failed)', s.run.end === 'fail' && /prevrnila/.test(s.run.why), JSON.stringify({ d, run: s.run }));
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  await page.click('#mis-res [data-mis="title"]'); await page.waitForTimeout(600);
  const gone = await page.evaluate(() => ({ run: !Missions.run, skin: !Render.scene.getObjectByName('misSkin') }));
  T.check('back to the title: the tanker\'s body gone', gone.run && gone.skin, JSON.stringify(gone));
  T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
T.done();
