// Special mission 34 · Mestni avtobus (js/missions/m34.js, the kit js/missions/kit.js) in the browser, upright (360 x 640, touch): ?misija=34
// in Toronto by day; the panel (POSTAJA, ZAMUDA, UDOBJE), no timing tower; in the scene the bus's own body (the car's hidden), the stops
// (one mesh: the shelters and the yellow lines) and the people waiting; driven to the kerb, braking in taps, the door at the first stop's
// line: ODPRI VRATA shows, pressed: the people board (the bus held), then on; the rest of the stops the same: done. A second run never
// stopping: three stops missed, failed. Back to the title: the stops, the people and the button gone. No errors on the page.
//   node tests/browser/m34.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';
import { careful } from './misdrive.mjs';

const T = checker('m34');
const srv = await serve();
const browser = await launch();
const ready = (page) => page.waitForFunction(() => window.__game.race && typeof Missions !== 'undefined' && Missions.run && window.__game.phase !== 'none', null, { timeout: 240000 });
const st = (page) => page.evaluate(() => { const g = window.__game, R = g.race, r = Missions.run, m = document.getElementById('mis'), vis = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; };
  return { track: R.track.def.id, run: r && { end: r.end, why: r.why, t: r.t, k: r.k, st: r.st, served: r.served, missed: r.missed, calm: r.ride.calm, locked: !!r.P.locked },
    rows: m ? [...m.querySelectorAll('.mis-row')].map(e => e.innerText.replace(/\s+/g, ' ').trim()) : [], btn: vis('#mis-btn'), tower: vis('#tw-strip') || vis('#h-tower'), res: document.getElementById('mis-res') && document.getElementById('mis-res').innerText.replace(/\s+/g, ' ') }; });
const LANE = `(P, r) => { const p = r.stops[r.k], T = r.race.track; if (!p) { P.laneBias = 0; return; } P.laneBias = r.def.door(r).along > -150 ? (p.w - r.def.K.WID / 2 - 0.5) - T.rl[p.i] : 0; }`;
const STOP = (auto) => `(P, r) => { r.autoDoor = ${auto}; const p = r.stops[r.k]; if (!p || r.st === 'board') return null; const A = r.def.door(r).along; if (A < -150 || A > 2) return null; const v = Math.hypot(P.vx, P.vz), vt = Math.sqrt(2 * 1.2 * Math.max(0, -A - 0.2)); return v > vt + 0.5 ? { thr: 0, brk: 1 } : v < vt - 0.3 && v < 9 ? { thr: 1, brk: 0 } : { thr: 0, brk: 0 }; }`;
const press = (page) => page.evaluate(() => document.getElementById('mis-btn').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 })));
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?misija=34', {}, { width: 360, height: 640 }, { touch: true });
  await ready(page); await page.waitForTimeout(300);
  let s = await st(page);
  T.check('?misija=34: Toronto', s.track === 'toronto', s.track);
  T.check('the panel: POSTAJA 1 / 6, ZAMUDA +0:20, UDOBJE ★★★★★; no button yet, no timing tower', s.rows[0] === 'POSTAJA 1 / 6' && s.rows[1] === 'ZAMUDA +0:20' && s.rows[2] === 'UDOBJE ★★★★★' && !s.btn && !s.tower, JSON.stringify(s.rows));
  const S = await page.evaluate(() => { const r = Missions.run, has = (o) => !!o && !!Render.scene.getObjectById(o.id), v = Render.viewOf(r.P);
    return { skin: !!r.skin && !!r.skin.parent, body: v.body.visible, stops: has(r.stopMesh), crowd: has(r.crowd.g), ids: [r.stopMesh.id, r.crowd.g.id] }; });
  T.check('in the scene: the bus\'s own body (the car\'s hidden), the stops, the people waiting', S.skin && !S.body && S.stops && S.crowd, JSON.stringify(S));
  // to the first stop, its door at the line: the button
  let d = await careful(page, { vmax: 40 / 3.6, lat: 2.6, pre: LANE, ctrl: STOP(false), maxT: 120, until: '(r) => r.btn.shown && Math.hypot(r.P.vx, r.P.vz) < 0.3' });
  await careful(page, { vmax: 40 / 3.6, lat: 2.6, pre: LANE, ctrl: STOP(false), maxT: 0.5 });
  s = await st(page);
  T.check('stopped at the first stop, the door at the line by the kerb: ODPRI VRATA shows', s.btn && s.run.k === 0 && s.run.st === 'drive', JSON.stringify({ d, run: s.run, btn: s.btn }));
  if (process.env.SHOT) { await page.evaluate(() => new Promise(requestAnimationFrame)); await page.screenshot({ path: 'test-results/m34-stop.png' }); }
  await press(page); await careful(page, { vmax: 40 / 3.6, lat: 2.6, pre: LANE, ctrl: STOP(false), maxT: 1 });
  s = await st(page);
  T.check('pressed: the people board, the bus held, the button gone', s.run.st === 'board' && s.run.locked && !s.btn, JSON.stringify(s.run));
  d = await careful(page, { vmax: 40 / 3.6, lat: 2.6, pre: LANE, ctrl: STOP(true), maxT: 600 });
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('every stop served, over the line: done, comfortable', s.run.end === 'win' && s.run.served === 6 && s.run.calm > 0.6 && /MISIJA OPRAVLJENA/.test(s.res), JSON.stringify({ d, run: s.run, res: s.res }));
  await page.click('#mis-res [data-mis="again"]'); await ready(page); await page.waitForTimeout(300);
  d = await careful(page, { vmax: 40 / 3.6, lat: 2.6, maxT: 600 });
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('never stopping: three stops missed, failed', s.run.end === 'fail' && /preveč postaj/.test(s.run.why) && /MISIJA NEUSPELA/.test(s.res), JSON.stringify({ d, run: s.run }));
  await page.click('#mis-res [data-mis="title"]'); await page.waitForTimeout(600);
  const gone = await page.evaluate((ids) => ids.every(id => !Render.scene.getObjectById(id)) && !Missions.run && !document.getElementById('mis-btn'), S.ids);
  T.check('back to the title: the stops, the people and the button gone', gone);
  T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
T.done();
