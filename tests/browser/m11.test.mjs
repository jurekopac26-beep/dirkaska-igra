// Special mission 11 · Ognjena reka (js/missions/m11.js, the kit js/missions/kit.js) in the browser, upright (360 x 640, touch):
// ?misija=11 on Mauna Kea at dusk, the 4x4 (MEDVED 4x4) by the domes facing down the road; the panel (PREHODI ODPRTI 3 / 3, ZAPRE SE,
// PEPEL, AVTO 100 %), no timing tower, the pace notes' arrow hidden; the three flows, their flames, the stones' bodies and circles, the
// volcano and the ash in the scene; a stone's red circle on the road ahead; near the first flow its tag (LAVA and its time); the mission's
// own driver down the road (round the circles, on the open side of the flows): done in the valley. Back to the title: the lava, the stones,
// the ash and the tags gone. No errors on the page.
//   node tests/browser/m11.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('m11');
const srv = await serve();
const browser = await launch();
const ready = (page) => page.waitForFunction(() => window.__game.race && typeof Missions !== 'undefined' && Missions.run && window.__game.phase !== 'none', null, { timeout: 240000 });
const st = (page) => page.evaluate(() => { const g = window.__game, R = g.race, r = Missions.run, m = document.getElementById('mis'), vis = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; };
  return { track: R.track.def.id, car: R.player.m.id, tod: Render.atmos.tod, run: r && { end: r.end, why: r.why, t: r.t, hp: r.hp, hits: r.hits }, rows: m ? [...m.querySelectorAll('.mis-row')].map(e => e.innerText.replace(/\s+/g, ' ').trim()) : [],
    tower: vis('#tw-strip') || vis('#h-tower'), back: document.body.classList.contains('mis-back'), tag: (document.getElementById('mis-tags') || {}).innerText || '', res: document.getElementById('mis-res') && document.getElementById('mis-res').innerText.replace(/\s+/g, ' ') }; });
const drive = (page, cond, maxT) => page.evaluate(([cond, maxT]) => {
  const g = window.__game, r = Missions.run, f = new Function('r', 'return ' + cond), t0 = r.t; let circ = 0;
  for (let k = 0; k < 40000 && !r.end && r.t - t0 < maxT && !f(r); k++) { const a = r.def.pilot(r, {}); g.sim(0.05, false, a[0], a[1], a[2]); if (r.rocks.some(o => !o.done) && r.fx.rock.some(R => R.c.visible)) circ++; }
  return { t: r.t, end: r.end, s: r.P.q.s, circ };
}, [cond, maxT]);
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?misija=11', {}, { width: 360, height: 640 }, { touch: true });
  await ready(page); await page.waitForTimeout(300);
  let s = await st(page);
  T.check('?misija=11: Mauna Kea at dusk, the 4x4', s.track === 'maunakea' && s.car === 'medved' && s.tod === 'dusk', `${s.track} ${s.car} ${s.tod}`);
  T.check('the panel: PREHODI ODPRTI 3 / 3, ZAPRE SE 3:20 · 2,5 km, PEPEL 0 %, AVTO 100 %; no timing tower; the pace notes hidden', s.rows[0] === 'PREHODI ODPRTI 3 / 3' && /^ZAPRE SE 0?3:20 · 2,5 km$/.test(s.rows[1]) && s.rows[2] === 'PEPEL 0 %' && s.rows[3] === 'AVTO 100 %' && !s.tower && s.back, JSON.stringify(s.rows));
  const S = await page.evaluate(() => { const r = Missions.run, f = r.fx, inS = (o) => !!Render.scene.getObjectById(o.id); return { lava: f.lava.length === 3 && f.lava.every(L => inS(L.m)), fire: inS(f.fire.flames.P) && inS(f.volc.flames.P), rocks: f.rock.length === 4 && f.rock.every(R => inS(R.b) && inS(R.c)), ash: inS(f.ash), ids: [f.lava[0].m.id, f.rock[0].c.id, f.ash.id, f.volc.flames.P.id] }; });
  T.check('the three flows, the flames, the volcano, the stones and their circles, the ash in the scene', S.lava && S.fire && S.rocks && S.ash, JSON.stringify(S));
  let d = await drive(page, 'r.rocks.length > 0', 30);
  await page.waitForTimeout(400);
  const C = await page.evaluate(() => { const r = Missions.run, k = r.rocks[0], R = r.fx.rock[0]; return { circle: R.c.visible, at: Math.hypot(R.c.position.x - k.x, R.c.position.z - k.z), ahead: r.P.q.s - k.s }; });
  T.check('a stone: its red circle on the road ahead of the car', C.circle && C.at < 0.01 && C.ahead > 0, JSON.stringify(C));
  d = await drive(page, 'r.P.q.s < r.cx[0].s + 500', 240);
  await page.waitForTimeout(1200);   // (the camera catches up in real frames: the tags are placed by it)
  s = await st(page);
  T.check('near the first flow its tag: LAVA and its time', /LAVA\s*0?\d:\d\d/.test(s.tag), s.tag);
  d = await drive(page, 'false', 420);
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('the mission\'s own driver down the road (round the circles, on the open side of the flows): done in the valley', s.run.end === 'win' && /MISIJA OPRAVLJENA/.test(s.res) && s.rows[0] !== 'PREHODI ODPRTI 3 / 3', JSON.stringify({ d, run: s.run, res: s.res, rows: s.rows }));
  await page.click('#mis-res [data-mis="title"]'); await page.waitForTimeout(600);
  const gone = await page.evaluate((ids) => ({ objs: ids.every(id => !Render.scene.getObjectById(id)), run: !Missions.run, back: document.body.classList.contains('mis-back'), tags: !document.getElementById('mis-tags') }), S.ids);
  T.check('back to the title: the lava, the stones, the ash and the tags gone, the pace notes back', gone.objs && gone.run && !gone.back && gone.tags, JSON.stringify(gone));
  T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
T.done();
