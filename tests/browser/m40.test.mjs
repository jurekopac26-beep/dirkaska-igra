// Special mission 40 · Varnostni avto (js/missions/m40.js, the kit js/missions/kit.js) in the browser, upright (360 x 640, touch):
// ?misija=40 on Bathurst, the safety car (VORTEX) on pole with the field of eight behind it, the safety car out with no car of its own
// (the HUD's board VARNOSTNI AVTO); the panel (DELTA, KOLONA, ODSTRANJEVANJE 0 %, GUME); the light bar on the player's car, the recovery
// truck, the wreck, the marshals and their flags in the scene; by the top of the hill the wreck's tag (RAZBIT AVTO and its %), the lamps
// flashing; the road clear: the UGASNI LUČI button (its own pointer events): the lights off; the mission's own driver into the pit lane:
// done. Back to the title: the truck, the wreck, the flags, the button and the tags gone, the light bar off the car; no errors.
//   node tests/browser/m40.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('m40');
const srv = await serve();
const browser = await launch();
const ready = (page) => page.waitForFunction(() => window.__game.race && typeof Missions !== 'undefined' && Missions.run && window.__game.phase !== 'none', null, { timeout: 240000 });
const st = (page) => page.evaluate(() => { const g = window.__game, R = g.race, r = Missions.run, m = document.getElementById('mis'), vis = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; };
  return { track: R.track.def.id, car: R.player.m.id, ai: R.cars.length - 1, sc: R.fl && R.fl.sc && R.fl.sc.state, run: r && { end: r.end, why: r.why, t: r.t, clear: r.clear, off: r.off, stars: r.stars }, rows: m ? [...m.querySelectorAll('.mis-row')].map(e => e.innerText.replace(/\s+/g, ' ').trim()) : [],
    flag: (document.getElementById('h-flag') || {}).textContent || '', btn: vis('#mis-btn'), tag: (document.getElementById('mis-tags') || {}).innerText || '', res: document.getElementById('mis-res') && document.getElementById('mis-res').innerText.replace(/\s+/g, ' ') }; });
const drive = (page, cond, maxT, o) => page.evaluate(([cond, maxT, o]) => {
  const g = window.__game, r = Missions.run, f = new Function('r', 'return ' + cond), t0 = r.t;
  for (let k = 0; k < 40000 && !r.end && r.t - t0 < maxT && !f(r); k++) { const a = r.def.pilot(r, o || {}); g.sim(0.05, false, a[0], a[1], a[2]); }
  r.press = false; return { t: r.t, end: r.end, dist: r.P.dist, clear: r.clear, off: r.off, g1: r.g1, delta: r.delta };
}, [cond, maxT, o]);
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?misija=40', {}, { width: 360, height: 640 }, { touch: true });
  await ready(page); await page.waitForTimeout(300);
  await page.waitForFunction(() => { const e = document.querySelector('#mis .mis-row'); return e && e.innerText.trim() !== ''; }, null, { timeout: 60000 });   // (the panel shown once the start's intro is over)
  let s = await st(page);
  T.check('?misija=40: Bathurst, the safety car (VORTEX) with the field of eight, the safety car out with no car of its own', s.track === 'bathurst' && s.car === 'vortex' && s.ai === 8 && s.sc === 'mis', JSON.stringify({ track: s.track, car: s.car, ai: s.ai, sc: s.sc }));
  T.check('the panel: DELTA, KOLONA, ODSTRANJEVANJE 0 %, GUME; the HUD\'s board VARNOSTNI AVTO', /^DELTA [+−]\d+,\d s$/.test(s.rows[0]) && /^KOLONA /.test(s.rows[1]) && s.rows[2] === 'ODSTRANJEVANJE 0 %' && /^GUME \d+ °C$/.test(s.rows[3]) && s.flag === 'VARNOSTNI AVTO', JSON.stringify(s.rows) + ' ' + s.flag);
  const S = await page.evaluate(() => { const r = Missions.run, f = r.fx, inS = (o) => !!Render.scene.getObjectById(o.id), v = Render.viewOf(r.P);
    return { bar: !!f.bar && f.bar.parent === v.bodyG && f.lamps.length === 2, site: inS(f.truck) && inS(f.wreck) && inS(f.cable) && inS(f.pole) && inS(f.cloth) && f.flags.length === 4, ids: [f.truck.id, f.wreck.id, f.cloth.id, f.pole.id] }; });
  T.check('the light bar on the player\'s car; the recovery truck, the wreck, the marshals\' flags in the scene', S.bar && S.site, JSON.stringify(S));
  await drive(page, 'r.P.dist > r.def.K.CRASH - 260', 200);
  await page.waitForTimeout(1200);   // (the camera catches up in real frames: the tags are placed by it)
  s = await st(page);
  const L = await page.evaluate(() => { const f = Missions.run.fx; return { on: f.lamps.some(l => l.material === f.mOn), cable: f.cable.visible }; });
  T.check('by the top of the hill: the wreck\'s tag (RAZBIT AVTO and its %), the lamps flashing, the field close behind', /RAZBIT AVTO\s*\d+ %/.test(s.tag) && L.on && /^KOLONA \d+ m$/.test(s.rows[1]) && parseInt(s.rows[1].slice(7)) < 45, s.tag + ' ' + JSON.stringify(L) + ' ' + s.rows[1]);
  // the road clear: the button, pressed by its own pointer events: the lights off
  await drive(page, 'r.clear', 120, { never: true });
  await page.waitForTimeout(400);
  s = await st(page);
  T.check('the road clear: ODSTRANJEVANJE 100 %, the UGASNI LUČI button', s.run.clear && !s.run.off && s.rows[2] === 'ODSTRANJEVANJE 100 %' && s.btn, JSON.stringify(s.run) + ' btn ' + s.btn);
  await page.evaluate(() => { const b = document.getElementById('mis-btn'); b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 7 })); b.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 7 })); });
  await page.evaluate(() => { const g = window.__game; g.sim(0.05, false, 0, 0.5, 0); });
  const Off = await page.evaluate(() => { const r = Missions.run, f = r.fx; return { off: r.off, dark: f.lamps.every(l => l.material === f.mOff) }; });
  await page.waitForTimeout(300);
  s = await st(page);
  T.check('UGASNI LUČI: the lights off, the lamps dark, the button gone', Off.off && Off.dark && !s.btn, JSON.stringify(Off) + ' btn ' + s.btn);
  const d = await drive(page, 'false', 200);
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('the mission\'s own driver into the pit lane: done', s.run.end === 'win' && s.run.stars >= 2 && /MISIJA OPRAVLJENA/.test(s.res), JSON.stringify({ d, run: s.run, res: s.res, rows: s.rows }));
  await page.click('#mis-res [data-mis="title"]'); await page.waitForTimeout(600);
  const gone = await page.evaluate((ids) => ({ objs: ids.every(id => !Render.scene.getObjectById(id)), run: !Missions.run, tags: !document.getElementById('mis-tags'), btn: !document.getElementById('mis-btn') }), S.ids);
  T.check('back to the title: the truck, the wreck, the flags, the button and the tags gone', gone.objs && gone.run && gone.tags && gone.btn, JSON.stringify(gone));
  T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
T.done();
