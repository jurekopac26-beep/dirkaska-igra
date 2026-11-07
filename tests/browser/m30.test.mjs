// Special mission 30 · Ratrak (js/missions/m30.js, the kit js/missions/kit.js) in the browser, upright (360 x 640, touch): ?misija=30 on
// Mount Baldy, at night in the snow; the panel (UREJENO, VITEL, NAKLON, SMUČARJI OB), no timing tower; in the scene the fresh snow over
// the road, the groomed trail, the town's lights, the snowcat's own body (the car's hidden); a driver up the road holding the winch's pace
// on the steep stretches: the winch hooks there (its cable and post shown), the trail grows; over the finish with the road groomed: done.
// A second run: stopped on a steep stretch, the cable snaps (failed). Back to the title: the mission's things gone. No errors on the page.
//   node tests/browser/m30.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('m30');
const srv = await serve();
const browser = await launch();
const ready = (page) => page.waitForFunction(() => window.__game.race && typeof Missions !== 'undefined' && Missions.run && window.__game.phase !== 'none', null, { timeout: 240000 });
const st = (page) => page.evaluate(() => { const g = window.__game, R = g.race, r = Missions.run, P = R.player, m = document.getElementById('mis'), vis = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; };
  return { track: R.track.def.id, atmos: Render.atmos, run: r && { end: r.end, why: r.why, t: r.t, done: r.done, n: r.cells.length, hook: !!r.hook, ten: r.ten }, rows: m ? [...m.querySelectorAll('.mis-row')].map(e => e.innerText.replace(/\s+/g, ' ').trim()) : [],
    tower: vis('#tw-strip') || vis('#h-tower'), res: document.getElementById('mis-res') && document.getElementById('mis-res').innerText.replace(/\s+/g, ' ') }; });
// a driver: the autopilot's steering, the pedals to hold v m/s (the winch's pace while hooked, else vmax); until cond(r) or the end
const drive = (page, cond, vmax, maxT, stopHooked) => page.evaluate(([cond, vmax, maxT, stopHooked]) => {
  const g = window.__game, r = Missions.run, K = r.def.K, f = new Function('r', 'return ' + cond), t0 = r.t; let hooked = 0, slack = 0;
  for (let k = 0; k < 40000 && !r.end && r.t - t0 < maxT && !f(r); k++) {
    const P = r.P, v = Math.hypot(P.vx, P.vz), vt = r.hook ? (stopHooked ? 0 : K.VD) : vmax;
    Core.aiControl(P, g.race, 0.05);
    let thr = 0, brk = 0; if (vt > 0) { if (v < vt) thr = 0.8; else if (v > vt + 1) brk = 0.4; } else brk = 1;
    g.sim(0.1, false, P.inSteer * (P.gear < 0 ? -1 : 1), thr, brk);
    if (r.hook) { hooked++; if (r.ten < K.SLACK) slack++; }
  }
  return { t: r.t, end: r.end, done: r.done, n: r.cells.length, hooked, slack, trail: r.trail ? r.trail.n : -1 };
}, [cond, vmax, maxT, stopHooked]);
try {
  let { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?misija=30', {}, { width: 360, height: 640 }, { touch: true });
  await ready(page); await page.waitForTimeout(300);
  let s = await st(page);
  T.check('?misija=30: Mount Baldy, winter at night', s.track === 'baldy' && s.atmos.season === 'winter' && s.atmos.tod === 'night', JSON.stringify({ track: s.track, atmos: s.atmos }));
  T.check('the panel: UREJENO 0 %, VITEL, NAKLON, SMUČARJI OB 7:00; no timing tower', s.rows[0] === 'UREJENO 0 %' && /^VITEL /.test(s.rows[1]) && /^NAKLON \d+ %$/.test(s.rows[2]) && s.rows[3] === 'SMUČARJI OB 7:00' && !s.tower, JSON.stringify(s.rows));
  const S = await page.evaluate(() => { const r = Missions.run, has = (o) => !!o && !!Render.scene.getObjectById(o.id), v = Render.viewOf(r.P);
    return { trail: has(r.trail.mesh), cable: has(r.cable), post: has(r.post), skin: !!r.skin && !!r.skin.parent, body: v.body.visible, town: (r.props || []).some(o => o.isPoints), n: (r.props || []).length }; });
  T.check('in the scene: the trail, the cable, the post, the town\'s lights; the snowcat\'s own body (the car\'s hidden)', S.trail && S.cable && S.post && S.skin && !S.body && S.town, JSON.stringify(S));
  // up the road at the winch's pace on the steep stretches
  let d = await drive(page, 'r.hook', 8.5, 120);
  s = await st(page);
  T.check('a steep stretch: the winch hooked, its cable shown, VITEL in %', s.run.hook && /^VITEL \d+ %$/.test(s.rows[1]) && await page.evaluate(() => Missions.run.cable.visible && Missions.run.post.visible), JSON.stringify({ d, rows: s.rows }));
  d = await drive(page, 'false', 8.5, 700);
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('over the finish with the road groomed: done', s.run.end === 'win' && s.run.done / s.run.n >= 0.92 && /MISIJA OPRAVLJENA/.test(s.res), JSON.stringify({ d, run: s.run, res: s.res }));
  T.check('at the winch\'s pace it holds (slack under a tenth of the time hooked), the trail laid', d.hooked > 100 && d.slack < d.hooked * 0.1 && d.trail > 500, JSON.stringify(d));
  T.check('in time with stars to spare (under the 2 stars\' time)', s.run.t < 460, s.run.t.toFixed(1));
  await page.click('#mis-res [data-mis="again"]'); await ready(page); await page.waitForTimeout(500);
  // again: stopped on the steep stretch, the cable snaps
  await drive(page, 'r.hook', 8.5, 120);
  d = await drive(page, 'false', 8.5, 30, true);
  s = await st(page);
  T.check('stopped on a steep stretch: the cable snaps, failed', s.run.end === 'fail' && /strgala/.test(s.run.why), JSON.stringify({ d, run: s.run }));
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  const ids = await page.evaluate(() => [Missions.run.trail.mesh.id, Missions.run.cable.id]);
  await page.click('#mis-res [data-mis="title"]'); await page.waitForTimeout(600);
  const gone = await page.evaluate((ids) => ({ things: ids.every(id => !Render.scene.getObjectById(id)), run: !Missions.run }), ids);
  T.check('back to the title: the trail and the cable gone', gone.things && gone.run, JSON.stringify(gone));
  T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
T.done();
