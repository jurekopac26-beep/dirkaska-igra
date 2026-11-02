// Special mission 52 · Hiša na tovornjaku (js/missions/m52.js, the kit js/missions/kit.js) in the browser, upright (360 x 640, touch):
// ?misija=52 on Big Sur; the panel (ŠIRINA TOVORA, PROSTOR, PROMET ČAKA, HIŠA), no timing tower; in the scene the tractor's own body (the
// car's hidden), the trailer with the house drawn behind it (following the drawn car), the two escort cars, the waiting cars; a driver who
// keeps the room even left and right: to the finish with the house whole; a second run swerving to the left edge and back: scraped three times
// (failed). Back to the title: the house, the escorts and the cars gone. No errors on the page.
//   node tests/browser/m52.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('m52');
const srv = await serve();
const browser = await launch();
const ready = (page) => page.waitForFunction(() => window.__game.race && typeof Missions !== 'undefined' && Missions.run && window.__game.phase !== 'none', null, { timeout: 240000 });
const st = (page) => page.evaluate(() => { const g = window.__game, R = g.race, r = Missions.run, m = document.getElementById('mis'), vis = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; };
  return { track: R.track.def.id, run: r && { end: r.end, why: r.why, t: r.t, s: r.P.q.s, scr: r.scr, hp: r.hp }, rows: m ? [...m.querySelectorAll('.mis-row')].map(e => e.innerText.replace(/\s+/g, ' ').trim()) : [],
    tower: vis('#tw-strip') || vis('#h-tower'), res: document.getElementById('mis-res') && document.getElementById('mis-res').innerText.replace(/\s+/g, ' ') }; });
// a driver: steered at a point ahead, its offset across moved toward the side with more room by the difference (`left`: every other 50 m 2.4 m left of
// the middle, hugging the edge); vmax m/s
const drive = (page, maxT, vmax, left) => page.evaluate(([maxT, vmax, left]) => {
  const g = window.__game, r = Missions.run, Tr = g.race.track, t0 = r.t; let dT = 0;
  for (let k = 0; k < 40000 && !r.end && r.t - t0 < maxT; k++) {
    const P = r.P, v = Math.hypot(P.vx, P.vz), q = P.q, R = r.room;
    const want = left ? (Math.floor(q.s / 50) % 2 ? -2.4 : 0) : Math.max(-2.6, Math.min(2.6, q.d + (Math.min(R[1], 3) - Math.min(R[0], 3)) / 2)); dT += (want - dT) * 0.1;
    const i = Tr.idx(q.s + 10 + v * 0.5), x = Tr.px[i] + Tr.nx[i] * dT, z = Tr.pz[i] + Tr.nz[i] * dT;
    let e = Math.atan2(z - P.z, x - P.x) - P.h; e = Math.atan2(Math.sin(e), Math.cos(e));
    g.sim(0.05, false, Math.max(-1, Math.min(1, e * 2.5)), v < vmax ? 1 : 0, v > vmax + 1 ? 0.5 : 0);
  }
  return { t: r.t, end: r.end, s: r.P.q.s, scr: r.scr };
}, [maxT, vmax, left]);
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?misija=52', {}, { width: 360, height: 640 }, { touch: true });
  await ready(page); await page.waitForTimeout(300);
  let s = await st(page);
  T.check('?misija=52: Big Sur', s.track === 'bigsur', s.track);
  T.check('the panel: ŠIRINA TOVORA 6,4 m, PROSTOR L 2,1 · D 2,1, PROMET ČAKA 0, HIŠA 100 %; no timing tower', s.rows[0] === 'ŠIRINA TOVORA 6,4 m' && s.rows[1] === 'PROSTOR L 2,1 · D 2,1' && s.rows[2] === 'PROMET ČAKA 0' && s.rows[3] === 'HIŠA 100 %' && !s.tower, JSON.stringify(s.rows));
  const S = await page.evaluate(() => { const r = Missions.run, v = Render.viewOf(r.P), has = (o) => !!o && !!Render.scene.getObjectById(o.id);
    return { skin: !!r.skin && !!r.skin.parent, body: v.body.visible, tow: has(r.towG), front: has(r.front.g), back: has(r.back.g) }; });
  T.check('in the scene: the tractor\'s own body (the car\'s hidden), the trailer with the house, the two escort cars', S.skin && !S.body && S.tow && S.front && S.back, JSON.stringify(S));
  await page.evaluate(() => { const g = window.__game; for (let k = 0; k < 2000 && Missions.run.t < 0.3; k++) g.sim(0.05, false, 0, 0, 0); });
  await drive(page, 30, 9);
  await page.waitForTimeout(400);
  const W = await page.evaluate(() => { const r = Missions.run, v = Render.viewOf(r.P), m = r.towG, h = -v.grp.rotation.y, hx = v.grp.position.x - Math.cos(h) * r.tr.hitch, hz = v.grp.position.z - Math.sin(h) * r.tr.hitch;
    return { gap: Math.hypot(m.position.x - hx, m.position.z - hz), ahead: r.front.g.visible && r.back.g.visible }; });
  T.check('the trailer drawn at the drawn tractor\'s hitch (it does not lag it), the escorts out', W.gap < 0.05 && W.ahead, JSON.stringify(W));
  let d = await drive(page, 570, 9);
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('the room kept even left and right: to the finish, the house whole', s.run.end === 'win' && /MISIJA OPRAVLJENA/.test(s.res) && s.run.scr <= 1, JSON.stringify({ d, run: s.run, res: s.res }));
  T.check('in time (under the 2 stars\' time)', s.run.t < 480, s.run.t.toFixed(1));
  await page.click('#mis-res [data-mis="again"]'); await ready(page); await page.waitForTimeout(500);
  d = await drive(page, 300, 9, true);
  s = await st(page);
  T.check('swerving to the left edge and back: scraped three times, failed', s.run.end === 'fail' && s.run.scr >= 3 && /poškodovana/.test(s.run.why), JSON.stringify({ d, run: s.run }));
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  const ids = await page.evaluate(() => Missions.run.props.map(o => o.id));
  await page.click('#mis-res [data-mis="title"]'); await page.waitForTimeout(600);
  const gone = await page.evaluate((ids) => ({ things: ids.every(id => !Render.scene.getObjectById(id)), run: !Missions.run }), ids);
  T.check('back to the title: the house, the escorts and the waiting cars gone', gone.things && gone.run, JSON.stringify(gone));
  T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
T.done();
