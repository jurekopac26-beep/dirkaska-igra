// Special mission 39 · Konji v prikolici (js/missions/m39.js, the kit js/missions/kit.js) in the browser, upright (360 x 640, touch): ?misija=39
// on Monterey by day; the panel (MIR KONJ, SUNKI, DO HLEVA), no timing tower; in the scene the horse trailer behind the off-roader
// (swinging on the hitch: its angle in a bend), the stable (a red barn and its paddock) before the line; driven carefully (slowing for the
// bends): done with the horses calm. A second run at the racing pace: too fast into the hairpin, failed. Back to the title: the
// trailer and the stable gone. No errors on the page.
//   node tests/browser/m39.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';
import { careful } from './misdrive.mjs';

const T = checker('m39');
const srv = await serve();
const browser = await launch();
const ready = (page) => page.waitForFunction(() => window.__game.race && typeof Missions !== 'undefined' && Missions.run && window.__game.phase !== 'none', null, { timeout: 240000 });
const st = (page) => page.evaluate(() => { const g = window.__game, R = g.race, r = Missions.run, m = document.getElementById('mis'), vis = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; };
  return { track: R.track.def.id, car: R.player.m.id, atmos: Render.atmos, run: r && { end: r.end, why: r.why, t: r.t, calm: r.ride.calm, n: r.ride.n, ang: r.trl && r.trl.ang },
    rows: m ? [...m.querySelectorAll('.mis-row')].map(e => e.innerText.replace(/\s+/g, ' ').trim()) : [], tower: vis('#tw-strip') || vis('#h-tower'), res: document.getElementById('mis-res') && document.getElementById('mis-res').innerText.replace(/\s+/g, ' ') }; });
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?misija=39', {}, { width: 360, height: 640 }, { touch: true });
  await ready(page); await page.waitForTimeout(300);
  let s = await st(page);
  T.check('?misija=39: Monterey by day, the off-roader', s.track === 'monterey' && s.car === 'medved' && s.atmos.tod === 'day', JSON.stringify({ track: s.track, car: s.car, atmos: s.atmos }));
  T.check('the panel: MIR KONJ 100 %, SUNKI 0, DO HLEVA 3,6 km; no timing tower', s.rows[0] === 'MIR KONJ 100 %' && s.rows[1] === 'SUNKI 0' && s.rows[2] === 'DO HLEVA 3,6 km' && !s.tower, JSON.stringify(s.rows));
  const S = await page.evaluate(() => { const r = Missions.run, has = (o) => !!o && !!Render.scene.getObjectById(o.id), T = window.__game.race.track, i = T.idx(r.barnAt.s);
    return { trailer: has(r.trl.mesh), barn: has(r.barn.g), pad: has(r.pad), near: Math.hypot(r.barn.g.position.x - T.px[i], r.barn.g.position.z - T.pz[i]), ids: [r.trl.mesh.id, r.barn.g.id, r.pad.id] }; });
  T.check('in the scene: the horse trailer, the barn and its paddock beside the road before the line', S.trailer && S.barn && S.pad && S.near > 15 && S.near < 45, JSON.stringify(S));
  // to a bend: the trailer swings on its hitch
  let d = await careful(page, { vmax: 60 / 3.6, lat: 2.6, until: '(r) => r.P.q.s > 420 && r.P.q.s < 900', maxT: 80 });
  await page.waitForTimeout(100);
  let ang = 0; for (let k = 0; k < 12; k++) { await careful(page, { vmax: 60 / 3.6, lat: 2.6, maxT: 0.5 }); await page.evaluate(() => new Promise(requestAnimationFrame)); ang = Math.max(ang, Math.abs((await st(page)).run.ang || 0)); }
  T.check('in the hairpin: the trailer swings behind on its hitch', ang > 0.05 && ang < 1.2, ang.toFixed(3));
  if (process.env.SHOT) await page.screenshot({ path: 'test-results/m39-bend.png' });
  d = await careful(page, { vmax: 60 / 3.6, lat: 2.6, maxT: 400 });
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('driven carefully (slowing for the bends): done, the horses calm', s.run.end === 'win' && s.run.calm > 0.5 && /MISIJA OPRAVLJENA/.test(s.res), JSON.stringify({ d, run: s.run, res: s.res }));
  await page.click('#mis-res [data-mis="again"]'); await ready(page); await page.waitForTimeout(300);
  d = await careful(page, { vmax: 60 / 3.6, lat: 0, maxT: 120 });
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('at the racing pace into the hairpin: the horses panicked, failed', s.run.end === 'fail' && /preplašila/.test(s.run.why) && /MISIJA NEUSPELA/.test(s.res), JSON.stringify({ d, run: s.run }));
  await page.click('#mis-res [data-mis="title"]'); await page.waitForTimeout(600);
  const gone = await page.evaluate((ids) => ids.every(id => !Render.scene.getObjectById(id)) && !Missions.run, S.ids);
  T.check('back to the title: the trailer and the stable gone', gone);
  T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
T.done();
