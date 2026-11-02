// Special mission 50 · Panji na pašo (js/missions/m50.js, the kit js/missions/kit.js) in the browser, upright (360 x 640, touch): ?misija=50
// in Medvode past the Sava bridge, in the evening light; the panel (ČEBELE, SUNKI, DO PAŠE, SONCE ZAIDE), no timing tower; in the scene
// the lorry's own body with the bee house (the car's hidden), the potholes (one mesh), the hay rack, the lime tree at the finish; the
// light going toward dusk as the time runs; driven round the holes, slowing for the bends: done. A second run through the holes at the
// racing pace: the bees angry, failed (the bees out round the bee house). Back to the title: its things gone. No errors on the page.
//   node tests/browser/m50.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';
import { careful } from './misdrive.mjs';

const T = checker('m50');
const srv = await serve();
const browser = await launch();
const ready = (page) => page.waitForFunction(() => window.__game.race && typeof Missions !== 'undefined' && Missions.run && window.__game.phase !== 'none', null, { timeout: 240000 });
const st = (page) => page.evaluate(() => { const g = window.__game, R = g.race, r = Missions.run, m = document.getElementById('mis'), vis = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; };
  return { track: R.track.def.id, run: r && { end: r.end, why: r.why, t: r.t, calm: r.ride.calm, n: r.ride.n, s: r.P.q.s, bees: r.bees ? r.bees.geometry.drawRange.count : -1 },
    rows: m ? [...m.querySelectorAll('.mis-row')].map(e => e.innerText.replace(/\s+/g, ' ').trim()) : [], tower: vis('#tw-strip') || vis('#h-tower'), res: document.getElementById('mis-res') && document.getElementById('mis-res').innerText.replace(/\s+/g, ' ') }; });
const DODGE = `(P, r) => { const T = r.race.track, qs = P.q.s, h = r.holes.find(h => !h.done && h.s > qs - 3 && h.s < qs + 60); if (!h) { P.laneBias = 0; return; } const i = T.idx(h.s), d = (h.x - T.px[i]) * T.nx[i] + (h.z - T.pz[i]) * T.nz[i]; P.laneBias = (d > 0 ? d - 2.3 : d + 2.3) - T.rl[i]; }`;
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?misija=50', {}, { width: 360, height: 640 }, { touch: true });
  await ready(page); await page.waitForTimeout(300);
  let s = await st(page);
  T.check('?misija=50: Medvode, past the Sava bridge', s.track === 'medvode' && Math.abs(s.run.s - 4066) < 10, JSON.stringify({ track: s.track, s: s.run.s }));
  T.check('the panel: ČEBELE mirne, SUNKI 0, DO PAŠE 2,4 km, SONCE ZAIDE čez 5 min; no timing tower', s.rows[0] === 'ČEBELE mirne' && s.rows[1] === 'SUNKI 0' && s.rows[2] === 'DO PAŠE 2,4 km' && s.rows[3] === 'SONCE ZAIDE čez 5 min' && !s.tower, JSON.stringify(s.rows));
  const S = await page.evaluate(() => { const r = Missions.run, has = (o) => !!o && !!Render.scene.getObjectById(o.id), v = Render.viewOf(r.P);
    return { skin: !!r.skin && !!r.skin.parent, body: v.body.visible, holes: has(r.holeMesh), koz: has(r.koz), lipa: has(r.lipa), ids: [r.holeMesh.id, r.koz.id, r.lipa.id] }; });
  T.check('in the scene: the lorry with the bee house (the car\'s body hidden), the potholes, the hay rack, the lime tree', S.skin && !S.body && S.holes && S.koz && S.lipa, JSON.stringify(S));
  const tod0 = await page.evaluate(() => Missions.run.tod);
  let d = await careful(page, { vmax: 50 / 3.6, lat: 2.6, pre: DODGE, maxT: 90 });
  const tod1 = await page.evaluate(() => Missions.run.tod);
  T.check('the light goes toward dusk as the time runs', tod1 > tod0 + 0.1, `${tod0} -> ${tod1}`);
  if (process.env.SHOT) await page.screenshot({ path: 'test-results/m50-road.png' });
  d = await careful(page, { vmax: 50 / 3.6, lat: 2.6, pre: DODGE, maxT: 300 });
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('round the holes, slowing for the bends: done before sunset, the bees calm', s.run.end === 'win' && s.run.calm > 0.3 && /MISIJA OPRAVLJENA/.test(s.res), JSON.stringify({ d, run: s.run, res: s.res }));
  await page.click('#mis-res [data-mis="again"]'); await ready(page); await page.waitForTimeout(300);
  let bees = 0; d = await careful(page, { vmax: 55 / 3.6, lat: 0, maxT: 300, until: '(r) => r.ride.calm < 0.2' });
  bees = (await st(page)).run.bees;
  d = await careful(page, { vmax: 55 / 3.6, lat: 0, maxT: 300 });
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('through the holes at the racing pace: the bees out round the bee house, then angry: failed', bees > 20 && s.run.end === 'fail' && /razjezile/.test(s.run.why) && /MISIJA NEUSPELA/.test(s.res), JSON.stringify({ bees, d, run: s.run }));
  await page.click('#mis-res [data-mis="title"]'); await page.waitForTimeout(600);
  const gone = await page.evaluate((ids) => ids.every(id => !Render.scene.getObjectById(id)) && !Missions.run, S.ids);
  T.check('back to the title: the holes, the hay rack and the lime tree gone', gone);
  T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
T.done();
