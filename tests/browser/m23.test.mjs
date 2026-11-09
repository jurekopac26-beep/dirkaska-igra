// Special mission 23 · Lovec na meteorite (js/missions/m23.js, the kit js/missions/kit.js) in the browser, upright (360 x 640, touch):
// ?misija=23 on Marrakesh at night, the 4x4 (MEDVED 4x4), three rival hunters in 4x4s; the panel (METEORITI 0 / 8, NASLEDNJI UDAR,
// TEKMECI 0), no timing tower; the stones' pool and the shooting stars in the scene; the first ring on the road ahead with its tag
// (UDAR and its time); landed: the stone hot, its tag with its temperature; the mission's own driver (to each ring, stopped until the
// stone cools): done. Back to the title: the stones, the stars and the tags gone. No errors on the page.
//   node tests/browser/m23.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('m23');
const srv = await serve();
const browser = await launch();
const ready = (page) => page.waitForFunction(() => window.__game.race && typeof Missions !== 'undefined' && Missions.run && window.__game.phase !== 'none', null, { timeout: 240000 });
const st = (page) => page.evaluate(() => { const g = window.__game, R = g.race, r = Missions.run, m = document.getElementById('mis'), vis = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; };
  return { track: R.track.def.id, car: R.player.m.id, tod: Render.atmos.tod, hunters: R.cars.filter(c => c.hunter).map(c => c.m.id), run: r && { end: r.end, why: r.why, t: r.t, got: r.got, lost: r.lost }, rows: m ? [...m.querySelectorAll('.mis-row')].map(e => e.innerText.replace(/\s+/g, ' ').trim()) : [],
    tower: vis('#tw-strip') || vis('#h-tower'), tag: (document.getElementById('mis-tags') || {}).innerText || '', res: document.getElementById('mis-res') && document.getElementById('mis-res').innerText.replace(/\s+/g, ' ') }; });
const drive = (page, cond, maxT) => page.evaluate(([cond, maxT]) => {
  const g = window.__game, r = Missions.run, f = new Function('r', 'return ' + cond), t0 = r.t;
  for (let k = 0; k < 40000 && !r.end && r.t - t0 < maxT && !f(r); k++) { const a = r.def.pilot(r, {}); g.sim(0.05, false, a[0], a[1], a[2]); }
  return { t: r.t, end: r.end, got: r.got, lost: r.lost };
}, [cond, maxT]);
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?misija=23', {}, { width: 360, height: 640 }, { touch: true });
  await ready(page); await page.waitForTimeout(300);
  let s = await st(page);
  T.check('?misija=23: Marrakesh at night, the 4x4, three rival hunters in 4x4s', s.track === 'marrakesh' && s.car === 'medved' && s.tod === 'night' && s.hunters.length === 3 && s.hunters.every(m => m === 'medved'), JSON.stringify({ track: s.track, car: s.car, tod: s.tod, hunters: s.hunters }));
  T.check('the panel: METEORITI 0 / 8, NASLEDNJI UDAR, TEKMECI 0; no timing tower', s.rows[0] === 'METEORITI 0 / 8' && /^NASLEDNJI UDAR 0?0:0\d$/.test(s.rows[1]) && s.rows[2] === 'TEKMECI 0' && !s.tower, JSON.stringify(s.rows));
  const S = await page.evaluate(() => { const r = Missions.run, f = r.fx, inS = (o) => !!Render.scene.getObjectById(o.id); return { pool: f.st.length === 12 && f.st.every(x => inS(x.b) && inS(x.c) && inS(x.g)), sky: inS(f.sky), fire: inS(f.fire.flames.P), ids: [f.st[0].g.id, f.sky.id, f.fire.flames.P.id] }; });
  T.check('the stones\' pool (bodies, craters, rings), the glow and the shooting stars in the scene', S.pool && S.sky && S.fire, JSON.stringify(S));
  await drive(page, 'r.stones.length > 0', 20);
  await page.waitForTimeout(1200);   // (the camera catches up in real frames: the tags are placed by it)
  s = await st(page);
  const ring = await page.evaluate(() => { const r = Missions.run, o = r.stones[0], g = r.fx.st[0].g; return { vis: g.visible, at: Math.hypot(g.position.x - o.x, g.position.z - o.z), state: o.state }; });
  T.check('the first ring on the road ahead, its tag: UDAR, its time and the way to it', ring.vis && ring.at < 0.01 && ring.state === 'ring' && /UDAR\s*0?0:0\d · \d+ m/.test(s.tag), JSON.stringify(ring) + ' ' + s.tag);
  await drive(page, "r.stones[0].state === 'hot'", 30);
  await page.waitForTimeout(800);
  s = await st(page);
  T.check('landed: hot, its tag with its temperature', /METEORIT\s*\d+ °C/.test(s.tag), s.tag);
  const d = await drive(page, 'false', 420);
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('the mission\'s own driver (to each ring, stopped until the stone cools): done', s.run.end === 'win' && s.run.got === 8 && /MISIJA OPRAVLJENA/.test(s.res) && s.rows[0] === 'METEORITI 8 / 8', JSON.stringify({ d, run: s.run, res: s.res, rows: s.rows }));
  await page.click('#mis-res [data-mis="title"]'); await page.waitForTimeout(600);
  const gone = await page.evaluate((ids) => ({ objs: ids.every(id => !Render.scene.getObjectById(id)), run: !Missions.run, tags: !document.getElementById('mis-tags') }), S.ids);
  T.check('back to the title: the stones, the stars and the tags gone', gone.objs && gone.run && gone.tags, JSON.stringify(gone));
  T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
T.done();
