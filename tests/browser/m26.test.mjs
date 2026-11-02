// Special mission 26 · Zadnji odstotek (js/missions/m26.js, the kit js/missions/kit.js) in the browser, upright (360 x 640, touch):
// ?misija=26 on Tianmen, the STRELA EV; the panel (BATERIJA 3,0 %, DOMET, DO POLNILNICE, REKUPERACIJA), no timing tower, the pace notes'
// arrow hidden (driven down the road); the charger in the scene, its tag near the bottom; the mission's own driver down the road, gently (no throttle on
// the slope, braking into the bends): done at the charger with some battery left, the regeneration having given some back. Again with
// the throttle held: the battery empty before the charger (failed). Back to the title: the charger gone. No errors on the page.
//   node tests/browser/m26.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('m26');
const srv = await serve();
const browser = await launch();
const ready = (page) => page.waitForFunction(() => window.__game.race && typeof Missions !== 'undefined' && Missions.run && window.__game.phase !== 'none', null, { timeout: 240000 });
const st = (page) => page.evaluate(() => { const g = window.__game, R = g.race, r = Missions.run, m = document.getElementById('mis'), vis = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; };
  return { track: R.track.def.id, car: R.player.m.id, run: r && { end: r.end, why: r.why, t: r.t, b: r.b }, rows: m ? [...m.querySelectorAll('.mis-row')].map(e => e.innerText.replace(/\s+/g, ' ').trim()) : [],
    tower: vis('#tw-strip') || vis('#h-tower'), back: document.body.classList.contains('mis-back'), tag: (document.getElementById('mis-tags') || {}).innerText || '', res: document.getElementById('mis-res') && document.getElementById('mis-res').innerText.replace(/\s+/g, ' ') }; });
const drive = (page, cond, maxT, o) => page.evaluate(([cond, maxT, o]) => {
  const g = window.__game, r = Missions.run, f = new Function('r', 'return ' + cond), t0 = r.t; let back = 0, bPrev = r.b;
  for (let k = 0; k < 40000 && !r.end && r.t - t0 < maxT && !f(r); k++) { const a = r.def.pilot(r, o.pilot || {}); if (o.gas && !a[2]) a[1] = 1; g.sim(0.1, false, a[0], a[1], a[2]); if (r.b > bPrev) back += r.b - bPrev; bPrev = r.b; }
  return { t: r.t, end: r.end, s: r.P.q.s, b: r.b, back };
}, [cond, maxT, o || {}]);
try {
  let { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?misija=26', {}, { width: 360, height: 640 }, { touch: true });
  await ready(page); await page.waitForTimeout(300);
  let s = await st(page);
  T.check('?misija=26: Tianmen, the electric car', s.track === 'tianmen' && s.car === 'ev', `${s.track} ${s.car}`);
  T.check('the panel: BATERIJA 3,0 %, DOMET, DO POLNILNICE in km, REKUPERACIJA; no timing tower; the pace notes hidden', s.rows[0] === 'BATERIJA 3,0 %' && /^DOMET /.test(s.rows[1]) && /^DO POLNILNICE 4,\d km$/.test(s.rows[2]) && /^REKUPERACIJA \+0,00 %$/.test(s.rows[3]) && !s.tower && s.back, JSON.stringify(s.rows));
  const S = await page.evaluate(() => { const r = Missions.run; return { ch: !!r.ch && !!Render.scene.getObjectById(r.ch.g.id) }; });
  T.check('the charger in the scene', S.ch, JSON.stringify(S));
  let d = await drive(page, 'r.P.q.s < r.sEnd + 350', 700);
  await page.waitForTimeout(1200);   // (the camera catches up in real frames: the tag is placed by it)
  s = await st(page);
  T.check('near the bottom the charger\'s tag with the way to it', /POLNILNICA\s*0,\d km/.test(s.tag), s.tag);
  const back0 = d.back;
  d = await drive(page, 'false', 700);
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('down the road gently: done at the charger, battery left, under the 2 stars\' time', s.run.end === 'win' && s.run.b > 0.5 && s.run.t < 500 && /MISIJA OPRAVLJENA/.test(s.res), JSON.stringify({ d, run: s.run, res: s.res }));
  T.check('the brake gave some back on the way (regeneration)', back0 + d.back > 0.3, (back0 + d.back).toFixed(2));
  await page.click('#mis-res [data-mis="again"]'); await ready(page); await page.waitForTimeout(500);
  d = await drive(page, 'false', 600, { gas: true, pilot: { v: 14, lat: 3 } });
  s = await st(page);
  T.check('the throttle held: the battery empty before the charger, failed', s.run.end === 'fail' && /izpraznila/.test(s.run.why) && d.s > 400, JSON.stringify({ d, run: s.run }));
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  const id = await page.evaluate(() => Missions.run.ch.g.id);
  await page.click('#mis-res [data-mis="title"]'); await page.waitForTimeout(600);
  const gone = await page.evaluate((id) => ({ ch: !Render.scene.getObjectById(id), run: !Missions.run, back: document.body.classList.contains('mis-back'), tags: !document.getElementById('mis-tags') }), id);
  T.check('back to the title: the charger and its tag gone, the pace notes back', gone.ch && gone.run && !gone.back && gone.tags, JSON.stringify(gone));
  T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
T.done();
