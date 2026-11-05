// Special mission 10 · Pobegla čreda (js/missions/m10.js, the kit js/missions/kit.js) in the browser, upright (360 x 640, touch): ?misija=10
// on Harju by day; the panel (V OGRADI, V GOZDU, DO OGRADE), no timing tower; in the scene the pickup's own body (the car's hidden), the
// nine cows (one draw), the pen with its gate; slowly behind the herd, waiting at the pen: all nine in, done. A second run fast into the
// herd: scattered into the forest, failed. Back to the title: the cows and the pen gone. No errors on the page.
//   node tests/browser/m10.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';
import { careful } from './misdrive.mjs';

const T = checker('m10');
const srv = await serve();
const browser = await launch();
const ready = (page) => page.waitForFunction(() => window.__game.race && typeof Missions !== 'undefined' && Missions.run && window.__game.phase !== 'none', null, { timeout: 240000 });
const st = (page) => page.evaluate(() => { const g = window.__game, R = g.race, r = Missions.run, m = document.getElementById('mis'), vis = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; };
  return { track: R.track.def.id, run: r && { end: r.end, why: r.why, t: r.t, pin: r.pin, lost: r.lost },
    rows: m ? [...m.querySelectorAll('.mis-row')].map(e => e.innerText.replace(/\s+/g, ' ').trim()) : [], tower: vis('#tw-strip') || vis('#h-tower'), res: document.getElementById('mis-res') && document.getElementById('mis-res').innerText.replace(/\s+/g, ' ') }; });
const LANE = `(P, r) => { const T = r.race.track, f = r.cows.filter(c => c.st === 'free'); if (!f.length) return; const md = f.reduce((a, c) => a + c.d, 0) / f.length; P.laneBias = Math.max(-2, Math.min(2, md * 0.7)) - T.rl[T.idx(P.q.s)]; }`;
const HERD = `(P, r) => { const f = r.cows.filter(c => c.st === 'free'); if (!f.length) return null; const me = r.def.me(r), sr = Math.min(...f.map(c => c.s)), v = Math.hypot(P.vx, P.vz);
  if (sr > r.gs - r.def.K.LURE + 4) return { thr: 0, brk: v > 0.3 ? 1 : 0 }; const vt = Math.max(0, Math.min(3.5, (sr - 8 - me.s) * 0.4)); return { thr: v < vt - 0.2 ? 1 : 0, brk: v > vt + 0.6 ? 1 : 0 }; }`;
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?misija=10', {}, { width: 360, height: 640 }, { touch: true });
  await ready(page); await page.waitForTimeout(300);
  let s = await st(page);
  T.check('?misija=10: Harju', s.track === 'harju', s.track);
  T.check('the panel: V OGRADI 0 / 9, V GOZDU 0 / 3, DO OGRADE in m; no timing tower', s.rows[0] === 'V OGRADI 0 / 9' && s.rows[1] === 'V GOZDU 0 / 3' && /^DO OGRADE \d+ m$/.test(s.rows[2]) && !s.tower, JSON.stringify(s.rows));
  const S = await page.evaluate(() => { const r = Missions.run, has = (o) => !!o && !!Render.scene.getObjectById(o.id), v = Render.viewOf(r.P);
    return { skin: !!r.skin && !!r.skin.parent, body: v.body.visible, cows: has(r.herd.g) && r.herd.g.count === 9, pen: has(r.penMesh), ids: [r.herd.g.id, r.penMesh.id] }; });
  T.check('in the scene: the pickup\'s own body, the nine cows, the pen', S.skin && !S.body && S.cows && S.pen, JSON.stringify(S));
  let d = await careful(page, { vmax: 20 / 3.6, lat: 2.6, pre: LANE, ctrl: HERD, maxT: 40 });
  if (process.env.SHOT) { await page.evaluate(() => new Promise(requestAnimationFrame)); await page.screenshot({ path: 'test-results/m10-herd.png' }); }
  d = await careful(page, { vmax: 20 / 3.6, lat: 2.6, pre: LANE, ctrl: HERD, maxT: 300 });
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('slowly behind the herd, waiting at the pen: all nine in, done', s.run.end === 'win' && s.run.pin === 9 && /MISIJA OPRAVLJENA/.test(s.res), JSON.stringify({ d, run: s.run, res: s.res }));
  await page.click('#mis-res [data-mis="again"]'); await ready(page); await page.waitForTimeout(300);
  d = await careful(page, { vmax: 30 / 3.6, lat: 2.6, maxT: 200 });
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('fast into the herd: scattered into the forest, failed', s.run.end === 'fail' && /gozd/.test(s.run.why) && /MISIJA NEUSPELA/.test(s.res), JSON.stringify({ d, run: s.run }));
  await page.click('#mis-res [data-mis="title"]'); await page.waitForTimeout(600);
  const gone = await page.evaluate((ids) => ids.every(id => !Render.scene.getObjectById(id)) && !Missions.run, S.ids);
  T.check('back to the title: the cows and the pen gone', gone);
  T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
T.done();
