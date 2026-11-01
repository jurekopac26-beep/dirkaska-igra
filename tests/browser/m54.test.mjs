// Special mission 54 · Dirka tovornjakov (js/missions/m54.js, the kit js/missions/kit.js) in the browser, upright (360 x 640, touch):
// ?misija=54 on Nürburg; the panel (OMEJEVALNIK, POLOŽAJ, ZAVORE, VODA), the button HLADI; the trucks on the grid at K.S0 (all TITANs); HLADI
// held a second on hot brakes: they cool, the tank drains; the race on the autopilot, the water used when the brakes are hot: over the line,
// a win when first, else failed with the place. Back to the title: the button gone. No errors on the page.
//   node tests/browser/m54.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('m54');
const srv = await serve();
const browser = await launch();
const ready = (page) => page.waitForFunction(() => window.__game.race && typeof Missions !== 'undefined' && Missions.run && window.__game.phase !== 'none', null, { timeout: 240000 });
const st = (page) => page.evaluate(() => { const g = window.__game, R = g.race, r = Missions.run, m = document.getElementById('mis'), vis = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; };
  return { track: R.track.def.id, run: r && { end: r.end, why: r.why, t: r.t, s: r.P.q.s, pos: r.P.pos, heat: r.br.heat, water: r.water }, rows: m ? [...m.querySelectorAll('.mis-row')].map(e => e.innerText.replace(/\s+/g, ' ').trim()) : [],
    btn: vis('#mis-btn') && document.getElementById('mis-btn').textContent, res: document.getElementById('mis-res') && document.getElementById('mis-res').innerText.replace(/\s+/g, ' ') }; });
const btn = (page, type) => page.evaluate((type) => document.getElementById('mis-btn').dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 1 })), type);
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?misija=54', {}, { width: 360, height: 640 }, { touch: true });
  await ready(page); await page.waitForTimeout(300);
  let s = await st(page);
  T.check('?misija=54: Nürburg', s.track === 'nring', s.track);
  T.check('the panel: OMEJEVALNIK 160, POLOŽAJ 2 / 10, ZAVORE 0 %, VODA 100 %; the button HLADI', s.rows[0] === 'OMEJEVALNIK 160' && s.rows[1] === 'POLOŽAJ 2 / 10' && s.rows[2] === 'ZAVORE 0 %' && s.rows[3] === 'VODA 100 %' && s.btn === 'HLADI', JSON.stringify(s.rows) + ' ' + s.btn);
  const G = await page.evaluate(() => { const R = window.__game.race, K = Missions.run.def.K, Tr = R.track; return { n: R.cars.length, titans: R.cars.every(c => c.m.id === 'titan'), near: R.cars.every(c => c.q.s <= Tr.startS + K.S0 && c.q.s > Tr.startS + K.S0 - 60) }; });
  T.check('the ' + G.n + ' trucks on the grid at K.S0, all TITANs', G.titans && G.near && G.n === 10, JSON.stringify(G));
  await page.evaluate(() => { const g = window.__game; for (let k = 0; k < 2000 && Missions.run.t < 0.3; k++) g.sim(0.05, false, 0, 0, 0); });
  await page.evaluate(() => { Missions.run.br.heat = 1; });
  await btn(page, 'pointerdown'); await page.evaluate(() => { const g = window.__game; for (let k = 0; k < 20; k++) g.sim(0.05, false, 0, 0, 0); }); await btn(page, 'pointerup');
  s = await st(page);
  T.check('HLADI held a second on hot brakes: they cool, the tank drains', s.run.heat < 0.6 && s.run.water < 0.95 && s.run.water > 0.85, JSON.stringify(s.run));
  // the race on the autopilot, the water on the hot brakes
  const d = await page.evaluate(() => { const g = window.__game, r = Missions.run; let hot = 0;
    for (let k = 0; k < 40000 && !r.end && r.t < 590; k++) { r.autoCool = r.br.heat > 0.6; hot = Math.max(hot, r.br.heat); g.sim(0.05, true); }
    return { t: r.t, end: r.end, pos: r.P.pos, hot }; });
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('the race to the line (' + d.pos + '.): a win when first, else failed with the place', d.end === 'win' ? d.pos === 1 && /MISIJA OPRAVLJENA/.test(s.res) : d.end === 'fail' && new RegExp(d.pos + '\\. mestu').test(s.run.why), JSON.stringify({ d, res: s.res }));
  T.check('the brakes got hot in the braking zones and the water kept them under fading', d.hot > 0.55 && d.hot < 1, d.hot.toFixed(2));
  await page.click('#mis-res [data-mis="title"]'); await page.waitForTimeout(600);
  const gone = await page.evaluate(() => ({ btn: !document.getElementById('mis-btn'), run: !Missions.run }));
  T.check('back to the title: the button gone', gone.btn && gone.run, JSON.stringify(gone));
  T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
T.done();
