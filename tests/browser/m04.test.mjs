// Special mission 04 · Vlečna služba (js/missions/m04.js, the kit js/missions/kit.js) in the browser, upright (360 x 640, touch): ?misija=04
// on Pikes Peak; the panel (NAPETOST VRVI, ŠKODA NA AVTU, DO DOLINE), no timing tower, the pace notes' arrow hidden (driven down the road);
// in the scene the tow truck's own body (the car's hidden), the broken car behind it and the strap; the crew hooks it, then the mission's
// own driver down the road to the start line: done in time. Again: hard braking from a high speed snaps the strap (failed). Back to the
// title: the mission's things gone, the arrow back. No errors on the page.
//   node tests/browser/m04.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('m04');
const srv = await serve();
const browser = await launch();
const ready = (page) => page.waitForFunction(() => window.__game.race && typeof Missions !== 'undefined' && Missions.run && window.__game.phase !== 'none', null, { timeout: 240000 });
const st = (page) => page.evaluate(() => { const g = window.__game, R = g.race, r = Missions.run, m = document.getElementById('mis'), vis = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden' && e.getBoundingClientRect().width > 0; };
  return { track: R.track.def.id, run: r && { end: r.end, why: r.why, t: r.t, stage: r.stage, dmg: r.dmg, ten: r.ten }, rows: m ? [...m.querySelectorAll('.mis-row')].map(e => e.innerText.replace(/\s+/g, ' ').trim()) : [],
    tower: vis('#tw-strip') || vis('#h-tower'), back: document.body.classList.contains('mis-back'), res: document.getElementById('mis-res') && document.getElementById('mis-res').innerText.replace(/\s+/g, ' ') }; });
// the mission's own driver (down the road) until cond(r) or the end; brk: full brake from then on
const drive = (page, cond, maxT, o) => page.evaluate(([cond, maxT, o]) => {
  const g = window.__game, r = Missions.run, f = new Function('r', 'return ' + cond), t0 = r.t; let red = 0;
  for (let k = 0; k < 40000 && !r.end && r.t - t0 < maxT && !f(r); k++) { const a = r.def.pilot(r, o.pilot || {}); g.sim(0.1, false, a[0], o.brk ? 0 : a[1], o.brk ? 1 : a[2]); if (r.ten > r.def.K.RED) red++; }
  return { t: r.t, end: r.end, s: r.P.q.s, v: Math.hypot(r.P.vx, r.P.vz), red, dmg: r.dmg };
}, [cond, maxT, o || {}]);
try {
  let { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?misija=04', {}, { width: 360, height: 640 }, { touch: true });
  await ready(page); await page.waitForTimeout(300);
  let s = await st(page);
  T.check('?misija=04: Pikes Peak', s.track === 'pikes', s.track);
  T.check('the panel: NAPETOST VRVI, ŠKODA NA AVTU 0 %, DO DOLINE in km; no timing tower; the pace notes hidden', /^NAPETOST VRVI \d+ %$/.test(s.rows[0]) && s.rows[1] === 'ŠKODA NA AVTU 0 %' && /^DO DOLINE 6,\d km$/.test(s.rows[2]) && !s.tower && s.back, JSON.stringify(s.rows));
  const S = await page.evaluate(() => { const r = Missions.run, has = (o) => !!o && !!Render.scene.getObjectById(o.id), v = Render.viewOf(r.P);
    return { skin: !!r.skin && !!r.skin.parent, body: v.body.visible, car: has(r.car), rope: has(r.rope) }; });
  T.check('in the scene: the tow truck\'s own body (the car\'s hidden), the broken car, the strap', S.skin && !S.body && S.car && S.rope, JSON.stringify(S));
  let d = await drive(page, "r.stage === 'tow'", 30);
  T.check('first the crew hooks the car (the truck held), then towing', d.t >= 3.9 && !d.end, JSON.stringify(d));
  d = await drive(page, 'false', 700);
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('down the road to the start line: done, under the 2 stars\' time', s.run.end === 'win' && s.run.t < 620 && /MISIJA OPRAVLJENA/.test(s.res), JSON.stringify({ d, run: s.run, res: s.res }));
  T.check('driven gently: the strap never red, the car not wrecked', d.red === 0 && d.dmg < 0.8, JSON.stringify(d));
  await page.click('#mis-res [data-mis="again"]'); await ready(page); await page.waitForTimeout(500);
  // again: fast down the long straight (from 4100 m), then the brake held
  await drive(page, "r.stage === 'tow'", 30);
  await drive(page, 'r.P.q.s < 4095', 400);   // (gently down to the one long straight, then fast down it)
  await drive(page, 'Math.hypot(r.P.vx, r.P.vz) > 15.5 || r.P.q.s < 3960', 60, { pilot: { v: 22, lat: 3.5 } });
  d = await drive(page, 'false', 12, { brk: true });
  s = await st(page);
  T.check('hard braking from a high speed: the strap snaps, failed', s.run.end === 'fail' && /strgala/.test(s.run.why), JSON.stringify({ d, run: s.run }));
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  const ids = await page.evaluate(() => [Missions.run.car.id, Missions.run.rope.id]);
  await page.click('#mis-res [data-mis="title"]'); await page.waitForTimeout(600);
  const gone = await page.evaluate((ids) => ({ things: ids.every(id => !Render.scene.getObjectById(id)), run: !Missions.run, back: document.body.classList.contains('mis-back') }), ids);
  T.check('back to the title: the car and the strap gone, the pace notes back', gone.things && gone.run && !gone.back, JSON.stringify(gone));
  T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
T.done();
