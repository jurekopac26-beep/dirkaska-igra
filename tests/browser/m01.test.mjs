// Special mission 01 · Požar na vrhu (js/missions/m01.js, the kit js/missions/kit.js) in the browser, upright (360 x 640): ?misija=01 on
// Vršič, the fire engine C (the racing truck's physics, its own body: the cab, the ladder, the basket; the truck's own body hidden) on the
// hairpins below the house; the panel (HIŠA, OGENJ, VODA), no timing tower; the house beside the road with its flames and smoke; on the
// autopilot up to the house and stopped: the crew works (the finger's pad and GASI shown, the driving controls hidden, the truck held, the
// ladder up toward the house); GASI held: water used; every flame hit: done. Back to the title: the truck's own body back, the house, the
// pad gone. No errors on the page.
//   node tests/browser/m01.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('m01');
const srv = await serve();
const browser = await launch();
const ready = (page) => page.waitForFunction(() => window.__game.race && typeof Missions !== 'undefined' && Missions.run && window.__game.phase !== 'none', null, { timeout: 240000 });
const st = (page) => page.evaluate(() => { const g = window.__game, R = g.race, r = Missions.run, P = R.player, v = Render.viewOf(P), m = document.getElementById('mis'), pad = document.getElementById('mis-aim'), vis = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden' && e.getBoundingClientRect().width > 0; };
  return { track: R.track.def.id, car: P.m.id, vLim: P.m.vLim, truck: !!(v && v.bodyG.getObjectByName('misTruck')), bodyHid: !!(v && !v.body.visible), stage: r && r.stage, run: r && { end: r.end, why: r.why, t: r.t, water: r.water, f: r.f }, locked: P.locked,
    rows: m ? [...m.querySelectorAll('.mis-row')].map(e => e.innerText.replace(/\s+/g, ' ').trim()) : [], tower: vis('#tw-strip') || vis('#h-tower'), pad: vis('#mis-aim'), gasi: vis('#mis-aim .gasi'), touch: vis('#touch'), lift: r && r.truck ? r.truck.lift : 0,
    res: document.getElementById('mis-res') && document.getElementById('mis-res').innerText.replace(/\s+/g, ' ') }; });
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?misija=01', {}, { width: 360, height: 640 }, { touch: true });
  await ready(page); await page.waitForTimeout(300);
  let s = await st(page);
  T.check('?misija=01: Vršič, the fire engine (the racing truck slower), its own body on the view', s.track === 'vrsic' && s.car === 'titan' && s.vLim < 120 && s.truck && s.bodyHid, JSON.stringify(s));
  T.check('the panel: HIŠA 100 %, OGENJ, VODA 1500 l; no timing tower', /^HIŠA 100 %$/.test(s.rows[0]) && /^OGENJ \d+ %$/.test(s.rows[1]) && /^VODA 1500 l$/.test(s.rows[2]) && !s.tower, JSON.stringify({ rows: s.rows, tower: s.tower }));
  const H = await page.evaluate(() => { const r = Missions.run, g = r.H.g, T = window.__game.race.track, i = T.idx(r.sH), c = new THREE.Box3().setFromObject(g).getCenter(new THREE.Vector3());
    return { inScene: !!g.parent, dist: Math.hypot(c.x - T.px[i], c.z - T.pz[i]), flames: r.fire.flames && !!r.fire.flames.P.parent, smoke: r.fire.smoke && !!r.fire.smoke.P.parent, id: g.id }; });
  T.check('the house beside the road at the top, its flames and smoke', H.inScene && H.dist < 25 && H.flames && H.smoke, JSON.stringify(H));
  // on the autopilot up to the house, then on the brake (the autopilot's steering) until the crew starts
  await page.evaluate(() => { const g = window.__game, r = Missions.run; for (let k = 0; k < 3000 && !r.end && r.P.q.s - r.sH < -45; k++) g.sim(0.25, true);
    for (let k = 0; k < 300 && r.stage === 'drive' && !r.end; k++) { const v = Math.hypot(r.P.vx, r.P.vz); Core.aiControl(r.P, g.race, 0.05); g.sim(0.1, false, r.P.inSteer, v > 5 ? 0 : 0.35, v > 5 ? 1 : 0); } });
  await page.evaluate(() => window.__game.sim(1.5, false, 0, 0, 0));
  s = await st(page);
  T.check('stopped at the house: the crew works, the truck held, the ladder up', s.stage === 'fight' && s.locked && s.lift > 0.2 && !s.run.end, JSON.stringify(s));
  T.check('the finger\'s pad and GASI shown, the driving controls hidden', s.pad && s.gasi && !s.touch, JSON.stringify({ pad: s.pad, gasi: s.gasi, touch: s.touch }));
  // GASI held (a real press): the water goes
  const b = await page.$eval('#mis-aim .gasi', (e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await page.mouse.move(b.x, b.y); await page.mouse.down();
  await page.evaluate(() => window.__game.sim(2, false, 0, 0, 0));
  const w1 = (await st(page)).run.water; await page.mouse.up();
  T.check('GASI held 2 s: 50 l of water used', Math.abs(1500 - w1 - 50) < 2, String(w1));
  // the water on every flame in turn: done
  await page.evaluate(() => { const g = window.__game, r = Missions.run; for (let k = 0; k < r.H.fl.length && !r.end; k++) { const p = r.H.fl[k]; r.autoSpray = new THREE.Vector3(p[0], p[1], p[2]); for (let i = 0; i < 40 && r.fl[k] > 0; i++) g.sim(0.25, false, 0, 0, 0); } });
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('every flame out: done, the house standing', s.run.end === 'win' && s.run.f === 0 && /MISIJA OPRAVLJENA/.test(s.res), JSON.stringify({ run: s.run, res: s.res }));
  await page.click('#mis-res [data-mis="title"]'); await page.waitForTimeout(600);
  const gone = await page.evaluate((id) => ({ house: !Render.scene.getObjectById(id), pad: !document.getElementById('mis-aim') }), H.id);
  T.check('back to the title: the house and the pad gone', gone.house && gone.pad, JSON.stringify(gone));
  T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
T.done();
