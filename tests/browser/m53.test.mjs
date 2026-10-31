// Special mission 53 · Snežne verige (js/missions/m53.js, the kit js/missions/kit.js) in the browser, upright (360 x 640, touch): ?misija=53
// on Los Caracoles, winter by day; the panel (VERIGE, OPRIJEM, ZAPORA, POTNIKI), no timing tower; in the scene the coach's own body (the
// car's hidden), the truck across the road, the barrier; the chains: NAMESTI VERIGO held for K.FIT s fits one (let go early: none), the
// coach held until all four are on; a driver up the hairpins (left of the truck lying across the road) to the barrier: done in time.
// A second run: into the truck fast: failed. Back to the title: the mission's things and its button gone. No errors on the page.
//   node tests/browser/m53.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('m53');
const srv = await serve();
const browser = await launch();
const ready = (page) => page.waitForFunction(() => window.__game.race && typeof Missions !== 'undefined' && Missions.run && window.__game.phase !== 'none', null, { timeout: 240000 });
const st = (page) => page.evaluate(() => { const g = window.__game, R = g.race, r = Missions.run, m = document.getElementById('mis'), vis = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; };
  return { track: R.track.def.id, atmos: Render.atmos, run: r && { end: r.end, why: r.why, t: r.t, stage: r.stage, chains: r.chains, locked: !!r.P.locked, s: r.P.q.s }, rows: m ? [...m.querySelectorAll('.mis-row')].map(e => e.innerText.replace(/\s+/g, ' ').trim()) : [],
    btn: vis('#mis-btn'), tower: vis('#tw-strip') || vis('#h-tower'), res: document.getElementById('mis-res') && document.getElementById('mis-res').innerText.replace(/\s+/g, ' ') }; });
const sim = (page, sec) => page.evaluate((sec) => { const g = window.__game; for (let k = 0; k < sec / 0.05; k++) g.sim(0.05, false, 0, 0, 0); }, sec);
const press = (page, type) => page.evaluate((type) => document.getElementById('mis-btn').dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 1 })), type);
// a driver: the autopilot's steering (left of the truck near it), the gas on and off to hold vmax; until cond(r) or the end; into the truck: `ram`
const drive = (page, cond, maxT, vmax, ram) => page.evaluate(([cond, maxT, vmax, ram]) => {
  const g = window.__game, r = Missions.run, Tr = g.race.track, f = new Function('r', 'return ' + cond), t0 = r.t, sT = Tr.startS + r.def.K.TRUCK;
  for (let k = 0; k < 40000 && !r.end && r.t - t0 < maxT && !f(r); k++) {
    const P = r.P, v = Math.hypot(P.vx, P.vz);
    Core.aiControl(P, g.race, 0.05);
    let st = P.inSteer * (P.gear < 0 ? -1 : 1);
    if (Math.abs(P.q.s - sT) < 70) { const i = Tr.idx(P.q.s + 10), x = ram ? r.wk.x : Tr.px[i] - Tr.nx[i] * 3.6, z = ram ? r.wk.z : Tr.pz[i] - Tr.nz[i] * 3.6; let e = Math.atan2(z - P.z, x - P.x) - P.h; e = Math.atan2(Math.sin(e), Math.cos(e)); st = Math.max(-1, Math.min(1, e * 2.5)); }
    let thr = 0, brk = 0; if (P.inBrk > 0.3 && !ram) brk = P.inBrk; else if (v < vmax) thr = 1;
    g.sim(0.05, false, st, thr, brk);
  }
  return { t: r.t, end: r.end, s: r.P.q.s };
}, [cond, maxT, vmax, ram]);
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?misija=53', {}, { width: 360, height: 640 }, { touch: true });
  await ready(page); await page.waitForTimeout(300);
  let s = await st(page);
  T.check('?misija=53: Los Caracoles, winter by day', s.track === 'caracoles' && s.atmos.season === 'winter' && s.atmos.tod === 'day', JSON.stringify({ track: s.track, atmos: s.atmos }));
  T.check('the panel: VERIGE 0 / 4, OPRIJEM 100 %, ZAPORA čez 10 min, POTNIKI 46; the button; no timing tower', s.rows[0] === 'VERIGE 0 / 4' && s.rows[1] === 'OPRIJEM 100 %' && s.rows[2] === 'ZAPORA čez 10 min' && s.rows[3] === 'POTNIKI 46' && s.btn && !s.tower, JSON.stringify(s.rows));
  const S = await page.evaluate(() => { const r = Missions.run, has = (o) => !!o && !!Render.scene.getObjectById(o.id), v = Render.viewOf(r.P);
    return { wreck: has(r.wg), ruts: r.ruts.every(b => has(b.mesh)), skin: !!r.skin && !!r.skin.parent, body: v.body.visible }; });
  T.check('in the scene: the truck across the road, the chains\' tracks, the coach\'s own body (the car\'s hidden)', S.wreck && S.ruts && S.skin && !S.body, JSON.stringify(S));
  await page.evaluate(() => { const g = window.__game; for (let k = 0; k < 2000 && Missions.run.t < 0.3; k++) g.sim(0.05, false, 0, 0, 0); });   // (past the start's countdown: the run's clock going)
  const K = await page.evaluate(() => Missions.run.def.K);
  // the chains: held long enough fits one; let go early: none; the coach held meanwhile
  await press(page, 'pointerdown'); await sim(page, K.FIT * 0.5); await press(page, 'pointerup'); await sim(page, 0.5);
  s = await st(page);
  T.check('NAMESTI VERIGO let go early: no chain, the coach held', s.run.chains === 0 && s.run.stage === 'chains' && s.run.locked, JSON.stringify(s.run));
  await press(page, 'pointerdown'); await sim(page, K.FIT + 0.2); await press(page, 'pointerup');
  s = await st(page);
  T.check('held for K.FIT s: one chain on, VERIGE 1 / 4, still held', s.run.chains === 1 && s.rows[0] === 'VERIGE 1 / 4' && s.run.locked, JSON.stringify(s.rows));
  await page.evaluate(() => { Missions.run.autoChain = true; }); await sim(page, 3 * K.FIT + 0.8);
  s = await st(page);
  T.check('all four on: the coach free, the button gone', s.run.chains === 4 && s.run.stage === 'drive' && !s.run.locked && !s.btn, JSON.stringify(s.run));
  // up the hairpins, past the truck on the left, to the barrier
  let d = await drive(page, 'false', 560, 12.5);
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('to the barrier before the pass closes: done', s.run.end === 'win' && /MISIJA OPRAVLJENA/.test(s.res), JSON.stringify({ d, run: s.run, res: s.res }));
  T.check('in time with stars to spare (under the 2 stars\' time)', s.run.t < 510, s.run.t.toFixed(1));
  await page.click('#mis-res [data-mis="again"]'); await ready(page); await page.waitForTimeout(500);
  await page.evaluate(() => { const g = window.__game, r = Missions.run; r.autoChain = true; for (let k = 0; k < 4000 && r.stage === 'chains'; k++) g.sim(0.05, false, 0, 0, 0); });
  d = await drive(page, 'false', 200, 12.5, true);
  s = await st(page);
  T.check('into the truck across the road fast: failed', s.run.end === 'fail' && /trčil/.test(s.run.why), JSON.stringify({ d, run: s.run }));
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  const ids = await page.evaluate(() => [Missions.run.wg.id, Missions.run.ruts[0].mesh.id]);
  await page.click('#mis-res [data-mis="title"]'); await page.waitForTimeout(600);
  const gone = await page.evaluate((ids) => ({ things: ids.every(id => !Render.scene.getObjectById(id)), btn: !document.getElementById('mis-btn'), run: !Missions.run }), ids);
  T.check('back to the title: the truck, the tracks and the button gone', gone.things && gone.btn && gone.run, JSON.stringify(gone));
  T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
T.done();
