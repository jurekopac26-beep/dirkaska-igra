// Special mission 29 · Božična noč (js/missions/m29.js, the kit js/missions/kit.js) in the browser, upright (360 x 640, touch):
// ?misija=29 on Štajerska, a winter night, the pickup alone; the panel (TARČA, DARILA 12 / 12, ZADETKI V KROG 0 / 12, MOČ —), no timing
// tower; the villages (the houses, the lit windows, the lights), the circles, the presents and the snow in the scene, the pickup drawn
// with the presents on its bed; by the first house with lights its golden circle, its tag (HIŠA Z LUČKAMI and the way to it) and the
// VRZI button; VRZI held (the button's own pointer events): the power, the dot on the snow and the arc; let go: the present flies and
// lands; the mission's own driver to the end: done. Back to the title: the villages, the presents, the button and the tags gone, no errors.
//   node tests/browser/m29.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('m29');
const srv = await serve();
const browser = await launch();
const ready = (page) => page.waitForFunction(() => window.__game.race && typeof Missions !== 'undefined' && Missions.run && window.__game.phase !== 'none', null, { timeout: 240000 });
const st = (page) => page.evaluate(() => { const g = window.__game, R = g.race, r = Missions.run, m = document.getElementById('mis'), vis = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; };
  return { track: R.track.def.id, car: R.player.m.id, ai: R.cars.length - 1, tod: Render.atmos.tod, season: Render.atmos.season, run: r && { end: r.end, why: r.why, t: r.t, hits: r.hits, gifts: r.gifts, stars: r.stars }, rows: m ? [...m.querySelectorAll('.mis-row')].map(e => e.innerText.replace(/\s+/g, ' ').trim()) : [],
    tower: vis('#tw-strip') || vis('#h-tower'), btn: vis('#mis-btn'), tag: (document.getElementById('mis-tags') || {}).innerText || '', res: document.getElementById('mis-res') && document.getElementById('mis-res').innerText.replace(/\s+/g, ' ') }; });
const drive = (page, cond, maxT, o) => page.evaluate(([cond, maxT, o]) => {
  const g = window.__game, r = Missions.run, f = new Function('r', 'return ' + cond), t0 = r.t;
  for (let k = 0; k < 40000 && !r.end && r.t - t0 < maxT && !f(r); k++) { const a = r.def.pilot(r, o || {}); g.sim(0.05, false, a[0], a[1], a[2]); }
  r.press = false; return { t: r.t, end: r.end, dist: r.P.dist, hits: r.hits, gifts: r.gifts };
}, [cond, maxT, o]);
const sim = (page, t) => page.evaluate((t) => { const g = window.__game; for (let k = 0; k < Math.round(t / 0.05); k++) g.sim(0.05, false, 0, 0, 0.6); }, t);
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?misija=29', {}, { width: 360, height: 640 }, { touch: true });
  await ready(page); await page.waitForTimeout(300);
  await page.waitForFunction(() => { const e = document.querySelector('#mis .mis-row'); return e && e.innerText.trim() !== ''; }, null, { timeout: 60000 });   // (the panel shown once the start's intro is over)
  let s = await st(page);
  T.check('?misija=29: Štajerska, a winter night, the pickup (the 4x4\'s physics) alone', s.track === 'rbring' && s.car === 'medved' && s.ai === 0 && s.tod === 'night' && s.season === 'winter', JSON.stringify({ track: s.track, car: s.car, ai: s.ai, tod: s.tod, season: s.season }));
  T.check('the panel: TARČA, DARILA 12 / 12, ZADETKI V KROG 0 / 12, MOČ —; no timing tower', /^TARČA \d+ m$/.test(s.rows[0]) && s.rows[1] === 'DARILA 12 / 12' && s.rows[2] === 'ZADETKI V KROG 0 / 12' && s.rows[3] === 'MOČ —' && !s.tower, JSON.stringify(s.rows));
  const S = await page.evaluate(() => { const r = Missions.run, f = r.fx, inS = (o) => !!Render.scene.getObjectById(o.id);
    return { village: inS(f.body) && inS(f.win) && inS(f.lights) && f.lights.geometry.attributes.position.count > 400, rings: f.rings.length === 3 && f.rings.every(inS), gifts: f.gw.every(inS) && inS(f.flakes) && inS(f.dot) && inS(f.arc),
      skin: !!r.skin && f.gb.every(m => m.parent === r.skin), ids: [f.body.id, f.lights.id, f.rings[0].id, f.gw[0].id, f.flakes.id] }; });
  T.check('the villages (houses, lit windows, lights), the circles, the presents, the snow in the scene; the pickup drawn with the presents on its bed', S.village && S.rings && S.gifts && S.skin, JSON.stringify(S));
  await drive(page, 'r.P.dist > r.tg[0].s - 30', 60, { never: true });
  await page.waitForTimeout(1200);   // (the camera catches up in real frames: the tags are placed by it)
  s = await st(page);
  const C = await page.evaluate(() => { const r = Missions.run, h = r.tg[0], m = r.fx.rings.find(x => x.visible); return { ring: !!m && Math.hypot(m.position.x - h.cx, m.position.z - h.cz) < 0.01, tg: r.def.target(r) === h }; });
  T.check('by the first house with lights: its golden circle, its tag (HIŠA Z LUČKAMI and the way), the VRZI button', C.ring && C.tg && /HIŠA Z LUČKAMI\s*\d+ m/.test(s.tag) && s.btn, JSON.stringify(C) + ' ' + s.tag + ' btn ' + s.btn);
  // VRZI held by its own pointer events, the race stepped meanwhile: the power, the dot and the arc; let go: thrown, landed
  await page.evaluate(() => document.getElementById('mis-btn').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 7 })));
  await sim(page, 0.5);
  const Hd = await page.evaluate(() => { const r = Missions.run, f = r.fx; return { hold: r.hold, dot: f.dot.visible, arc: f.arc.visible, moc: r.vals.moc.text }; });
  T.check('VRZI held: the power (MOČ), the dot on the snow and its arc', Hd.hold > 0.3 && Hd.dot && Hd.arc && /^\d+ %$/.test(Hd.moc), JSON.stringify(Hd));
  await page.evaluate(() => document.getElementById('mis-btn').dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 7 })));
  await sim(page, 0.1);
  const Fl = await page.evaluate(() => { const r = Missions.run; return { fly: !!r.fly, gifts: r.gifts }; });
  await sim(page, 1.5);
  const Ld = await page.evaluate(() => { const r = Missions.run; return { snow: r.snow.length, fly: !!r.fly, row: r.vals.darila.text }; });
  T.check('let go: the present flies, then lands (DARILA 11 / 12)', Fl.fly && Fl.gifts === 11 && Ld.snow === 1 && !Ld.fly && Ld.row === '11 / 12', JSON.stringify({ Fl, Ld }));
  const d = await drive(page, 'false', 420);
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('the mission\'s own driver (VRZI held, let go with the dot in the circle) to the end: done', s.run.end === 'win' && s.run.hits >= 8 && /MISIJA OPRAVLJENA/.test(s.res), JSON.stringify({ d, run: s.run, res: s.res, rows: s.rows }));
  await page.click('#mis-res [data-mis="title"]'); await page.waitForTimeout(600);
  const gone = await page.evaluate((ids) => ({ objs: ids.every(id => !Render.scene.getObjectById(id)), run: !Missions.run, tags: !document.getElementById('mis-tags'), btn: !document.getElementById('mis-btn') }), S.ids);
  T.check('back to the title: the villages, the presents, the snow, the button and the tags gone', gone.objs && gone.run && gone.tags && gone.btn, JSON.stringify(gone));
  T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
T.done();
