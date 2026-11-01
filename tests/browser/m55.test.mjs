// Special mission 55 · Medvedi na cesti (js/missions/m55.js, the kit js/missions/kit.js) in the browser, upright (360 x 640, touch): ?misija=55
// on Beartooth by day; the panel (MEDVEDI, RAZDALJA, TURISTI ZUNAJ, ZASTOJ), no timing tower; in the scene the ranger's off-roader (its own
// body, the light bar), the jam (one mesh), the three bears (one draw), the tourists, the tag over the mother; past the jam in the left
// lane, stopped 40 m short: MEGAFON shows, pressed: the tourists back in their cars; then HUPA, pressed with pauses: the bears off the road,
// the jam cleared, done. A second run up to 15 m from her: failed. Back to the title: its things and the button gone. No errors on the page.
//   node tests/browser/m55.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';
import { careful } from './misdrive.mjs';

const T = checker('m55');
const srv = await serve();
const browser = await launch();
const ready = (page) => page.waitForFunction(() => window.__game.race && typeof Missions !== 'undefined' && Missions.run && window.__game.phase !== 'none', null, { timeout: 240000 });
const st = (page) => page.evaluate(() => { const g = window.__game, R = g.race, r = Missions.run, m = document.getElementById('mis'), b = document.getElementById('mis-btn'), vis = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; };
  return { track: R.track.def.id, run: r && { end: r.end, why: r.why, t: r.t, ag: r.ag, out: r.tour.filter(q => q.out).length, cleared: r.cleared, dist: r.dist },
    rows: m ? [...m.querySelectorAll('.mis-row')].map(e => e.innerText.replace(/\s+/g, ' ').trim()) : [], btn: vis('#mis-btn') ? b.textContent : null, tag: !!document.querySelector('#mis-tags i'), tower: vis('#tw-strip') || vis('#h-tower'), res: document.getElementById('mis-res') && document.getElementById('mis-res').innerText.replace(/\s+/g, ' ') }; });
const LANE = `(P, r) => { const T = r.race.track; P.laneBias = P.q.s > r.sB - 260 ? -r.w * 0.5 - T.rl[T.idx(P.q.s)] : 0; }`;
const STOP = (back) => `(P, r) => { const v = Math.hypot(P.vx, P.vz), rem = r.sB - ${back} - P.q.s, vt = Math.sqrt(2 * 1.5 * Math.max(0, rem)); return rem < 200 ? { thr: v < vt - 0.3 ? 1 : 0, brk: v > vt + 0.5 ? 1 : 0 } : null; }`;
const press = (page) => page.evaluate(() => document.getElementById('mis-btn').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 })));
const wait = (page, sec) => careful(page, { vmax: 0, lat: 0, maxT: sec, ctrl: '() => ({ thr: 0, brk: 0 })' });
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?misija=55', {}, { width: 360, height: 640 }, { touch: true });
  await ready(page); await page.waitForTimeout(300);
  let s = await st(page);
  T.check('?misija=55: Beartooth', s.track === 'beartooth', s.track);
  T.check('the panel: MEDVEDI mirni, RAZDALJA in m, TURISTI ZUNAJ 3, ZASTOJ 7 vozil; no timing tower', s.rows[0] === 'MEDVEDI mirni' && /^RAZDALJA \d+ m$/.test(s.rows[1]) && s.rows[2] === 'TURISTI ZUNAJ 3' && s.rows[3] === 'ZASTOJ 7 vozil' && !s.tower, JSON.stringify(s.rows));
  const S = await page.evaluate(() => { const r = Missions.run, has = (o) => !!o && !!Render.scene.getObjectById(o.id), v = Render.viewOf(r.P);
    return { skin: !!r.skin && !!r.skin.parent, body: v.body.visible, jam: has(r.jam), bears: has(r.herd.g) && r.herd.g.count === 3, crowd: has(r.crowd.g), ids: [r.jam.id, r.herd.g.id, r.crowd.g.id] }; });
  T.check('in the scene: the ranger\'s own body, the jam, the three bears, the tourists', S.skin && !S.body && S.jam && S.bears && S.crowd, JSON.stringify(S));
  let d = await careful(page, { vmax: 60 / 3.6, lat: 2.6, pre: LANE, ctrl: STOP(40), maxT: 120, until: '(r) => r.P.q.s > r.sB - 41 && Math.hypot(r.P.vx, r.P.vz) < 0.3' });
  s = await st(page);
  T.check('past the jam, stopped 40 m short of the bears: MEGAFON shows, the tag over the mother', s.btn === 'MEGAFON' && s.tag && s.run.dist > 25 && s.run.dist < 60, JSON.stringify({ d, btn: s.btn, tag: s.tag, dist: s.run.dist }));
  if (process.env.SHOT) { await page.evaluate(() => new Promise(requestAnimationFrame)); await page.screenshot({ path: 'test-results/m55-jam.png' }); }
  await press(page); await wait(page, 2.5);
  s = await st(page);
  T.check('MEGAFON: the tourists back in their cars; then HUPA', s.run.out === 0 && s.rows[2] === 'TURISTI ZUNAJ 0' && s.btn === 'HUPA', JSON.stringify({ out: s.run.out, btn: s.btn }));
  for (let k = 0; k < 4; k++) { await press(page); await wait(page, 2.2); }
  await wait(page, 20);
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('HUPA with pauses: the bears off the road, the jam cleared, done', s.run.end === 'win' && s.run.cleared && /razžen/.test(s.rows[3]) && /MISIJA OPRAVLJENA/.test(s.res), JSON.stringify({ run: s.run, rows: s.rows, res: s.res }));
  await page.click('#mis-res [data-mis="again"]'); await ready(page); await page.waitForTimeout(300);
  d = await careful(page, { vmax: 60 / 3.6, lat: 2.6, pre: LANE, ctrl: STOP(15), maxT: 150 });
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('up to 15 m from the mother: she charges, failed', s.run.end === 'fail' && /nevarna/.test(s.run.why) && /MISIJA NEUSPELA/.test(s.res), JSON.stringify({ d, run: s.run }));
  await page.click('#mis-res [data-mis="title"]'); await page.waitForTimeout(600);
  const gone = await page.evaluate((ids) => ids.every(id => !Render.scene.getObjectById(id)) && !Missions.run && !document.getElementById('mis-btn'), S.ids);
  T.check('back to the title: the jam, the bears, the tourists and the button gone', gone);
  T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
T.done();
