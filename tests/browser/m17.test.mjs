// Special mission 17 · Ledeni most (js/missions/m17.js, the kit js/missions/kit.js) in the browser, upright (360 x 640, touch): ?misija=17
// on Trois-Rivières, winter at night; the panel (VARNA HITROST 25–35, LED, RAZPOKE), no timing tower; the city's scenery hidden, the
// mission's own world in the scene (the ice sheet, the ice road, the spruces, the northern lights, the cracks), the truck's own body; the
// mission's own driver round the lap in the band: done. Again standing on the ice: it gives way (failed), the cracks drawn. Back to the
// title: the city's scenery back, the mission's things gone. No errors on the page.
//   node tests/browser/m17.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('m17');
const srv = await serve();
const browser = await launch();
const ready = (page) => page.waitForFunction(() => window.__game.race && typeof Missions !== 'undefined' && Missions.run && window.__game.phase !== 'none', null, { timeout: 240000 });
const st = (page) => page.evaluate(() => { const g = window.__game, R = g.race, r = Missions.run, m = document.getElementById('mis'), vis = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; };
  return { track: R.track.def.id, atmos: Render.atmos, run: r && { end: r.end, why: r.why, t: r.t, cr: r.cr }, rows: m ? [...m.querySelectorAll('.mis-row')].map(e => e.innerText.replace(/\s+/g, ' ').trim()) : [],
    tower: vis('#tw-strip') || vis('#h-tower'), city: Render.world.root.visible, res: document.getElementById('mis-res') && document.getElementById('mis-res').innerText.replace(/\s+/g, ' ') }; });
const drive = (page, cond, maxT, o) => page.evaluate(([cond, maxT, o]) => {
  const g = window.__game, r = Missions.run, f = new Function('r', 'return ' + cond), t0 = r.t; let out = 0, n = 0, mx = 0;
  for (let k = 0; k < 40000 && !r.end && r.t - t0 < maxT && !f(r); k++) { const a = o.stand ? [0, 0, 1] : r.def.pilot(r, o.pilot || {}); g.sim(0.1, false, a[0], a[1], a[2]); n++; if (r.t > 12 && (r.kmh < 25 || r.kmh > 35)) out++; mx = Math.max(mx, r.cr); }
  return { t: r.t, end: r.end, s: r.P.q.s, out: out / Math.max(1, n), mx };
}, [cond, maxT, o || {}]);
try {
  let { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?misija=17', {}, { width: 360, height: 640 }, { touch: true });
  await ready(page); await page.waitForTimeout(300);
  let s = await st(page);
  T.check('?misija=17: Trois-Rivières, winter at night', s.track === 'troisrivieres' && s.atmos.season === 'winter' && s.atmos.tod === 'night', JSON.stringify({ track: s.track, atmos: s.atmos }));
  T.check('the panel: VARNA HITROST 25–35 (km/h), LED (cm), RAZPOKE 0 %; no timing tower', /^VARNA HITROST 25–35 \d+ km\/h$/.test(s.rows[0]) && /^LED \d\d cm$/.test(s.rows[1]) && s.rows[2] === 'RAZPOKE 0 %' && !s.tower, JSON.stringify(s.rows));
  const S = await page.evaluate(() => { const r = Missions.run, v = Render.viewOf(r.P), P = r.props || [];
    return { skin: !!r.skin && !!r.skin.parent, body: v.body.visible, aur: !!r.aur && !!r.aur.parent, cracks: !!r.cracks && !!r.cracks.parent, inst: P.some(o => o.isInstancedMesh && o.count > 1000), n: P.length }; });
  T.check('the city hidden; the ice\'s world in the scene (the spruces, the northern lights, the cracks), the truck\'s own body', !s.city && S.skin && !S.body && S.aur && S.cracks && S.inst, JSON.stringify(S));
  let d = await drive(page, 'false', 500);
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('round the lap in the band: done, under the 2 stars\' time', s.run.end === 'win' && s.run.t < 345 && /MISIJA OPRAVLJENA/.test(s.res), JSON.stringify({ d, run: s.run, res: s.res }));
  T.check('mostly in the band, the cracks kept low', d.out < 0.2 && d.mx < 60, JSON.stringify(d));
  await page.click('#mis-res [data-mis="again"]'); await ready(page); await page.waitForTimeout(500);
  d = await drive(page, 'false', 120, { stand: true });
  s = await st(page);
  const cr = await page.evaluate(() => Missions.run.cracks.geometry.drawRange.count);
  T.check('standing on the ice: it gives way under the truck, failed; the cracks drawn round it', s.run.end === 'fail' && /udrl/.test(s.run.why) && cr > 10, JSON.stringify({ d, run: s.run, cr }));
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  const ids = await page.evaluate(() => [Missions.run.aur.id, Missions.run.cracks.id]);
  await page.click('#mis-res [data-mis="title"]'); await page.waitForTimeout(600);
  const gone = await page.evaluate((ids) => ({ things: ids.every(id => !Render.scene.getObjectById(id)), run: !Missions.run, city: !Render.world || Render.world.root.visible }), ids);
  T.check('back to the title: the mission\'s world gone, the city\'s scenery back', gone.things && gone.run && gone.city, JSON.stringify(gone));
  T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
T.done();
