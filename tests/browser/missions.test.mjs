// The special missions (js/missions.js, css/missions.css): the quick entry ?misija=vaja (upright, 360 x 640): the mission's race on its
// track (alone, one run), the mission's panel in the HUD (its card, its clock counting down, its gauges, the hint) and the intro card over
// the start; driven on the autopilot to the top: done, the result (the stars, the time, a new best), the record kept; Ponovi: the mission
// again; its damage gauge: failed at half damage, why; Misije: the list (the practice one under Za izbris), back to the title with no
// mission left; on its side (640 x 360) the panel and the result fit the screen; an unknown mission: a toast. No errors on the page.
//   node tests/browser/missions.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('missions');
const srv = await serve();
const browser = await launch();
const ready = (page) => page.waitForFunction(() => window.__game.race && typeof Missions !== "undefined" && Missions.run && window.__game.phase !== 'none', null, { timeout: 240000 });
const st = (page) => page.evaluate(() => { const g = window.__game, r = g.race, m = document.getElementById('mis'), rect = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height, r: b.right, b: b.bottom }; };
  return { phase: g.phase, screen: g.screen, track: r && r.track.def.id, cars: r ? r.cars.length : 0, tt: !!(r && r.timeTrial), run: Missions.run && { end: Missions.run.end, t: Missions.run.t, why: Missions.run.why }, cur: Missions.cur && Missions.cur.id,
    hudMis: document.getElementById('hud').classList.contains('mis'), card: m && m.querySelector('.mis-card h2') && m.querySelector('.mis-card h2').textContent, clock: m && m.querySelector('.mis-clock').textContent,
    rows: m ? [...m.querySelectorAll('.mis-row')].map(r => r.innerText.replace(/\s+/g, ' ').trim()) : [], hint: m && m.querySelector('.mis-hint').textContent, intro: !!(m && m.querySelector('.mis-intro.on')),
    res: document.getElementById('mis-res') && document.getElementById('mis-res').innerText.replace(/\s+/g, ' '), list: document.getElementById('mis-list') && document.getElementById('mis-list').innerText.replace(/\s+/g, ' '),
    rec: JSON.parse(localStorage.getItem('rra-misije') || '{}'), W: innerWidth, H: innerHeight, rRes: rect('#mis-res .mis-box'), rRows: rect('#mis .mis-rows'), rCard: rect('#mis .mis-card') }; });
const inView = (b, s) => b && b.x >= 0 && b.y >= 0 && b.r <= s.W + 0.5 && b.b <= s.H + 0.5;
try {
  {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?misija=vaja', {}, { width: 360, height: 640 }, { touch: true });
    await ready(page); await page.waitForTimeout(400);
    let s = await st(page);
    T.check('?misija=vaja: the mission\'s race in the Santa Monica Mountains, alone, one run', s.track === 'mulholland' && s.cars === 1 && s.tt && s.cur === 'vaja' && s.screen === 'none', JSON.stringify({ track: s.track, cars: s.cars, cur: s.cur, screen: s.screen }));
    T.check('the panel: the card, the clock at 03:00, the gauges, the hint; the intro card over the start', s.hudMis && s.card === 'Vaja: na vrh' && s.clock === '03:00' && s.rows.length === 2 && /^DO CILJA/.test(s.rows[0]) && /Vozi hitro/.test(s.hint) && s.intro, JSON.stringify(s));
    await page.evaluate(() => window.__game.sim(20, true));
    s = await st(page);
    T.check('driving: the intro card gone, the clock counts down, the way to the finish and the car in the gauges', !s.intro && /^02:[34]\d$/.test(s.clock) && /DO CILJA \d,\d km/.test(s.rows[0]) && /AVTO 100 %/.test(s.rows[1]) && s.run.t > 10, JSON.stringify({ clock: s.clock, rows: s.rows, t: s.run.t }));
    T.check('upright: the card and the gauges on the screen, apart', inView(s.rCard, s) && inView(s.rRows, s) && (s.rCard.r <= s.rRows.x || s.rCard.b <= s.rRows.y), JSON.stringify({ c: s.rCard, r: s.rRows }));
    await page.evaluate(() => window.__game.sim(200, true));
    await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
    s = await st(page);
    T.check('to the top: done, the race over, the result (stars, time, a new best)', s.run.end === 'win' && s.phase === 'done' && /MISIJA OPRAVLJENA!/.test(s.res) && /★/.test(s.res) && /NOV REKORD!/.test(s.res) && inView(s.rRes, s), JSON.stringify({ run: s.run, phase: s.phase, res: s.res }));
    T.check('the record kept (the best time, the stars, one run)', s.rec.vaja && s.rec.vaja.runs === 1 && s.rec.vaja.stars >= 1 && Math.abs(s.rec.vaja.best - s.run.t) < 1e-6, JSON.stringify(s.rec));
    // Ponovi: the mission again; the car damaged past half: failed
    await page.click('#mis-res [data-mis="again"]'); await ready(page);
    await page.evaluate(() => window.__game.sim(8, true));
    s = await st(page);
    T.check('Ponovi: the mission again from the start, no result', !s.res && s.cur === 'vaja' && !s.run.end && s.run.t < 8 && s.phase === 'racing', JSON.stringify({ res: s.res, run: s.run, phase: s.phase }));
    await page.evaluate(() => { window.__game.race.player.dmg = 0.55; window.__game.sim(0.5, true); });
    await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
    s = await st(page);
    T.check('half damage: failed, why; no new best, two runs', s.run.end === 'fail' && /MISIJA NEUSPELA/.test(s.res) && /preveč poškodovan/.test(s.res) && !/NOV REKORD/.test(s.res) && s.rec.vaja.runs === 2, JSON.stringify({ run: s.run, res: s.res, rec: s.rec }));
    // Misije: back to the title, the list over it
    await page.click('#mis-res [data-mis="list"]'); await page.waitForTimeout(800);
    s = await st(page);
    T.check('Misije: the title, no mission left, the list (the practice one under Za izbris, its stars)', s.screen === 'title' && !s.cur && !s.hudMis && /POSEBNE MISIJE|Posebne misije/i.test(s.list) && /ZA IZBRIS/i.test(s.list) && /VAJA/.test(s.list) && /★/.test(s.list), JSON.stringify({ screen: s.screen, cur: s.cur, list: s.list }));
    await page.click('#mis-list [data-mis="close"]');
    T.check('the list closes', !(await st(page)).list);
    T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
  // on its side: the panel and the result fit
  {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?misija=vaja', {}, { width: 640, height: 360 }, { touch: true });
    await ready(page); await page.evaluate(() => window.__game.sim(12, true));
    let s = await st(page);
    T.check('on its side: the card and the gauges on the screen, apart', inView(s.rCard, s) && inView(s.rRows, s) && s.rCard.r <= s.rRows.x, JSON.stringify({ c: s.rCard, r: s.rRows }));
    await page.evaluate(() => { window.__game.race.player.dmg = 0.6; window.__game.sim(0.5, true); });
    await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
    s = await st(page);
    T.check('on its side: the result on the screen', inView(s.rRes, s), JSON.stringify(s.rRes));
    await page.click('#mis-res [data-mis="title"]'); await page.waitForTimeout(600);
    s = await st(page);
    T.check('Glavni meni: the title, no mission', s.screen === 'title' && !s.cur && !s.res, JSON.stringify({ screen: s.screen, cur: s.cur }));
    T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
  // an unknown mission: a toast, the title
  {
    const init = () => document.addEventListener('DOMContentLoaded', () => { const el = document.getElementById('toast'); window.__toasts = []; new MutationObserver(() => window.__toasts.push(el.textContent)).observe(el, { childList: true, characterData: true, subtree: true }); });
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?misija=nikoli', {}, { width: 640, height: 360 }, { init });
    await page.waitForTimeout(2500);
    const s = await page.evaluate(() => ({ toasts: window.__toasts, cur: Missions.cur, race: !!window.__game.race }));
    T.check('?misija=nikoli: no mission, a toast names it', !s.cur && !s.race && s.toasts.some(t => /misija=nikoli/.test(t)), JSON.stringify(s));
    T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
} finally {
  await browser.close(); await srv.close();
}
T.done();
