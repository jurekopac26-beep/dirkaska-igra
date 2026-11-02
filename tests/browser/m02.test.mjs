// Special mission 02 · Zlata ura (js/missions/m02.js, the kit js/missions/kit.js) in the browser, upright (360 x 640, touch): ?misija=02 in
// Newcastle by day; the panel (UTRIP, STANJE, CILJ), no timing tower; in the scene the ambulance's own body (the car's hidden, its blue
// lamps), the accident (one mesh) with the helper, the hospital at the finish; stopped by the accident: NALOŽI shows, pressed: the crew
// loads, the van held; the pulse's trace drawn in its row; carefully to the hospital: done. A second run at the racing pace with the patient:
// the patient lost. Back to the title: its things and the button gone. No errors on the page.
//   node tests/browser/m02.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';
import { careful } from './misdrive.mjs';

const T = checker('m02');
const srv = await serve();
const browser = await launch();
const ready = (page) => page.waitForFunction(() => window.__game.race && typeof Missions !== 'undefined' && Missions.run && window.__game.phase !== 'none', null, { timeout: 240000 });
const st = (page) => page.evaluate(() => { const g = window.__game, R = g.race, r = Missions.run, m = document.getElementById('mis'), b = document.getElementById('mis-btn'), vis = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; };
  return { track: R.track.def.id, run: r && { end: r.end, why: r.why, t: r.t, st: r.st, hr: r.hr, locked: !!r.P.locked },
    rows: m ? [...m.querySelectorAll('.mis-row')].map(e => e.innerText.replace(/\s+/g, ' ').trim()) : [], btn: vis('#mis-btn') ? b.textContent : null, ecg: !!document.querySelector('#mis .mis-ecg'), tower: vis('#tw-strip') || vis('#h-tower'), res: document.getElementById('mis-res') && document.getElementById('mis-res').innerText.replace(/\s+/g, ' ') }; });
const LANE = `(P, r) => { const T = r.race.track; P.laneBias = r.st === 'go' && r.sA - P.q.s < 150 && r.sA - P.q.s > -5 ? r.site.side * (T.wS(r.sA) - 6.7) - T.rl[T.idx(P.q.s)] : 0; }`;
const STOP = (auto) => `(P, r) => { r.autoLoad = ${auto}; if (r.st !== 'go') return null; const rem = r.sA - P.q.s, v = Math.hypot(P.vx, P.vz), vt = Math.sqrt(2 * 2.5 * Math.max(0, rem)); return rem < 250 && rem > -10 ? { thr: v < vt - 0.3 ? 1 : 0, brk: v > vt + 0.5 ? 1 : 0 } : null; }`;
const press = (page) => page.evaluate(() => document.getElementById('mis-btn').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 })));
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?misija=02', {}, { width: 360, height: 640 }, { touch: true });
  await ready(page); await page.waitForTimeout(300);
  let s = await st(page);
  T.check('?misija=02: Newcastle', s.track === 'newcastle', s.track);
  T.check('the panel: UTRIP —, STANJE čaka pomoč, CILJ nesreča in km; no timing tower', s.rows[0] === 'UTRIP —' && s.rows[1] === 'STANJE čaka pomoč' && /^CILJ nesreča 1,\d km$/.test(s.rows[2]) && !s.tower, JSON.stringify(s.rows));
  const S = await page.evaluate(() => { const r = Missions.run, has = (o) => !!o && !!Render.scene.getObjectById(o.id), v = Render.viewOf(r.P);
    return { skin: !!r.skin && !!r.skin.parent, body: v.body.visible, wreck: has(r.wreck), helper: has(r.helper.g), hosp: has(r.hs.g), ids: [r.wreck.id, r.helper.g.id, r.hs.g.id] }; });
  T.check('in the scene: the ambulance\'s own body, the accident with the helper, the hospital', S.skin && !S.body && S.wreck && S.helper && S.hosp, JSON.stringify(S));
  let d = await careful(page, { vmax: 80 / 3.6, lat: 2.6, pre: LANE, ctrl: STOP(false), maxT: 150, until: '(r) => r.btn.shown && Math.hypot(r.P.vx, r.P.vz) < 0.5' });
  await careful(page, { vmax: 80 / 3.6, lat: 2.6, pre: LANE, ctrl: STOP(false), maxT: 0.6 });
  s = await st(page);
  T.check('stopped by the accident: NALOŽI shows', s.btn === 'NALOŽI' && s.run.st === 'go', JSON.stringify({ d, btn: s.btn, run: s.run }));
  if (process.env.SHOT) { await page.evaluate(() => new Promise(requestAnimationFrame)); await page.screenshot({ path: 'test-results/m02-site.png' }); }
  await press(page); await careful(page, { vmax: 80 / 3.6, lat: 2.6, pre: LANE, ctrl: STOP(false), maxT: 1 });
  s = await st(page);
  T.check('NALOŽI: the crew loads, the van held, the button gone', s.run.st === 'load' && s.run.locked && !s.btn, JSON.stringify(s.run));
  d = await careful(page, { vmax: 80 / 3.6, lat: 2.6, pre: LANE, ctrl: STOP(true), maxT: 10, until: '(r) => r.st === "carry" && r.t > r.tLoad + 2' });
  s = await st(page);
  T.check('loaded: UTRIP in beats a minute, its trace drawn in the row', s.run.st === 'carry' && /^UTRIP ♥ 1\d\d \/ min$/.test(s.rows[0]) && s.ecg && /^CILJ bolnišnica /.test(s.rows[2]), JSON.stringify({ rows: s.rows, ecg: s.ecg }));
  d = await careful(page, { vmax: 80 / 3.6, lat: 2.6, pre: LANE, ctrl: STOP(true), maxT: 240 });
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('carefully to the hospital: done, the patient stable', s.run.end === 'win' && s.run.hr < 150 && /MISIJA OPRAVLJENA/.test(s.res), JSON.stringify({ d, run: s.run, res: s.res }));
  await page.click('#mis-res [data-mis="again"]'); await ready(page); await page.waitForTimeout(300);
  d = await careful(page, { vmax: 110 / 3.6, lat: 0, pre: LANE, ctrl: STOP(true), maxT: 240 });
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('at the racing pace with the patient: the patient lost, failed', s.run.end === 'fail' && /ni preživel/.test(s.run.why) && /MISIJA NEUSPELA/.test(s.res), JSON.stringify({ d, run: s.run }));
  await page.click('#mis-res [data-mis="title"]'); await page.waitForTimeout(600);
  const gone = await page.evaluate((ids) => ids.every(id => !Render.scene.getObjectById(id)) && !Missions.run && !document.getElementById('mis-btn'), S.ids);
  T.check('back to the title: the accident, the hospital and the button gone', gone);
  T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
T.done();
