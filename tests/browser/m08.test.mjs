// Special mission 08 · Izgubljeni v gozdu (js/missions/m08.js, the kit js/missions/kit.js) in the browser, upright (360 x 640, touch):
// ?misija=08 on Ouninpohja, at night; the panel (the thermal camera's window over NAJDENI 0 / 3, BATERIJA ŽAROMETA), no timing tower; the
// searchlight's pad over the road (the driving controls kept), its pool and beam and the pickup's own body in the scene, three hikers;
// the mission's own driver with the searchlight at the nearest hiker: each found, out at the road, in the back when the pickup stops by
// them; on to the rescuers: done. A second run with the battery nearly empty: failed. Back to the title: the pad and the window gone.
// No errors on the page.
//   node tests/browser/m08.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('m08');
const srv = await serve();
const browser = await launch();
const ready = (page) => page.waitForFunction(() => window.__game.race && typeof Missions !== 'undefined' && Missions.run && window.__game.phase !== 'none', null, { timeout: 240000 });
const st = (page) => page.evaluate(() => { const g = window.__game, R = g.race, r = Missions.run, m = document.getElementById('mis'), vis = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; };
  return { track: R.track.def.id, atmos: Render.atmos, run: r && { end: r.end, why: r.why, t: r.t, found: r.found, aboard: r.aboard, bat: r.bat }, rows: m ? [...m.querySelectorAll('.mis-row')].map(e => e.innerText.replace(/\s+/g, ' ').trim()) : [],
    tower: vis('#tw-strip') || vis('#h-tower'), thermo: vis('#mis .mis-thermo canvas'), pad: vis('#mis-aim.on.drive'), touch: vis('#touch'), res: document.getElementById('mis-res') && document.getElementById('mis-res').innerText.replace(/\s+/g, ' ') }; });
const drive = (page, cond, maxT) => page.evaluate(([cond, maxT]) => {
  const g = window.__game, r = Missions.run, f = new Function('r', 'return ' + cond), t0 = r.t; const seen = [];
  for (let k = 0; k < 40000 && !r.end && r.t - t0 < maxT && !f(r); k++) { const a = r.def.pilot(r); g.sim(0.1, false, a[0], a[1], a[2]); for (const h of r.h) if (!seen.includes(h.k + h.st)) seen.push(h.k + h.st); }
  return { t: r.t, end: r.end, s: r.P.q.s, found: r.found, aboard: r.aboard, bat: r.bat, seen };
}, [cond, maxT]);
try {
  let { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?misija=08', {}, { width: 360, height: 640 }, { touch: true });
  await ready(page); await page.waitForTimeout(300);
  let d = await drive(page, 'r.t > 2', 10); await page.waitForTimeout(300);
  let s = await st(page);
  T.check('?misija=08: Ouninpohja, at night', s.track === 'ouninpohja' && s.atmos.tod === 'night', JSON.stringify({ track: s.track, atmos: s.atmos }));
  T.check('the panel: the thermal camera\'s window, NAJDENI 0 / 3, BATERIJA ŽAROMETA in %; no timing tower', s.thermo && s.rows[0] === 'NAJDENI 0 / 3' && /^BATERIJA ŽAROMETA \d+ %$/.test(s.rows[1]) && !s.tower, JSON.stringify(s.rows));
  T.check('the searchlight\'s pad over the road, the driving controls kept', s.pad && s.touch, JSON.stringify({ pad: s.pad, touch: s.touch }));
  const S = await page.evaluate(() => { const r = Missions.run, has = (o) => !!o && !!Render.scene.getObjectById(o.id), v = Render.viewOf(r.P);
    return { skin: !!r.skin && !!r.skin.parent, body: v.body.visible, pool: has(r.L.pool), beam: has(r.L.beam), head: !!r.L.head.parent, ppl: has(r.ppl.g), n: r.h.length }; });
  T.check('in the scene: the pickup\'s own body (the car\'s hidden), the searchlight, its pool and beam, three hikers', S.skin && !S.body && S.pool && S.beam && S.head && S.ppl && S.n === 3, JSON.stringify(S));
  d = await drive(page, 'false', 600);
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('each hiker found, out at the road, in the back', ['0walk', '0in', '1walk', '1in', '2walk', '2in'].every(x => d.seen.includes(x)) && s.run.aboard === 3, JSON.stringify(d.seen));
  T.check('on to the rescuers: done, battery left, under the 2 stars\' time', s.run.end === 'win' && s.run.bat > 5 && s.run.t < 470 && /MISIJA OPRAVLJENA/.test(s.res), JSON.stringify({ d, run: s.run, res: s.res }));
  await page.click('#mis-res [data-mis="again"]'); await ready(page); await page.waitForTimeout(500);
  await page.evaluate(() => { Missions.run.bat = 1; });
  d = await drive(page, 'false', 60);
  s = await st(page);
  T.check('the battery empty before the rescuers: failed', s.run.end === 'fail' && /Baterija/.test(s.run.why), JSON.stringify({ d, run: s.run }));
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  await page.click('#mis-res [data-mis="title"]'); await page.waitForTimeout(600);
  const gone = await page.evaluate(() => ({ pad: !document.getElementById('mis-aim'), thermo: !document.querySelector('.mis-thermo'), tags: !document.getElementById('mis-tags'), run: !Missions.run }));
  T.check('back to the title: the pad, the window and the tags gone', gone.pad && gone.thermo && gone.tags && gone.run, JSON.stringify(gone));
  T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
T.done();
