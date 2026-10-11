// NEW VERSION · TEST 1 (the title's button, js/game.js nvStart, js/newmap.js): the button top right on the title (upright and on its side),
// a tap starts Toskana alone with the new map built over it (no rivals, no lights, no laps to count), the car at HOME (where a mission ends) driving freely past
// the road's barriers, on the new map's ground (the snow hill), up to the map's edge; back to the title the page loads again.
//   node tests/browser/newver.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('newver');
const srv = await serve();
const browser = await launch();
const PAGE = srv.base + '/index.html';
try {
  const open = (vp) => openGame(browser, PAGE, { intro: 2, quali: 0 }, vp, { menu: true });
  const ready = (page) => page.waitForFunction(() => window.Menu && Menu.ready && document.getElementById('menu-host').shadowRoot.querySelector('#s-title'), null, { timeout: 60000 });
  const box = (page) => page.evaluate(() => { const r = document.getElementById('menu-host').shadowRoot, b = r.querySelector('[data-act="newver"]'), l = r.querySelector('.logo'); if (!b) return null; const q = b.getBoundingClientRect(), lq = l.getBoundingClientRect(); return { x: q.x, y: q.y, r: q.right, b: q.bottom, lr: lq.right, lb: lq.bottom, W: innerWidth, H: innerHeight, txt: b.textContent }; });

  // 1. the button: on the title, top right, inside the screen, clear of the logo (a small phone upright and on its side)
  for (const vp of [{ width: 360, height: 640 }, { width: 640, height: 360 }]) {
    const { ctx, page, errors } = await open(vp);
    await ready(page); await page.waitForTimeout(400);
    const b = await box(page);
    T.check(`${vp.width}x${vp.height}: NEW VERSION · TEST 1 on the title, top right, inside the screen and clear of the logo`, !!b && /NEW VERSION/.test(b.txt) && /TEST 1/.test(b.txt) && b.x > b.W / 2 && b.r <= b.W && b.y >= 0 && b.b < b.H / 2 && (b.x >= b.lr || b.y >= b.lb), JSON.stringify(b));
    T.check(`${vp.width}x${vp.height}: no errors on the title`, !errors.length, errors.slice(0, 2).join(' | '));
    await ctx.close();
  }

  // 2. a tap: Toskana alone, the new map, free driving from HOME
  {
    const { ctx, page, errors } = await open({ width: 412, height: 915 });
    await ready(page);
    await page.evaluate(() => document.getElementById('menu-host').shadowRoot.querySelector('[data-act="newver"]').click());
    const t0 = Date.now();
    await page.waitForFunction(() => { const g = window.__game; return g && g.race && g.race.nv && !document.getElementById('nv-load') && g.phase === 'racing'; }, null, { timeout: 300000, polling: 500 });
    const o = await page.evaluate(() => { const g = window.__game, R = g.race, P = R.player, T = R.track; return { id: T.def.id, cars: R.cars.length, ground: typeof T.ground2 === 'function', free: !!T.free, mk: !!(window.MK && window.MK.hub4), x: P.x, z: P.z, hud: document.getElementById('hud').classList.contains('nv') }; });
    T.check('the tap starts Toskana alone (no rivals), the new map built (window.MK, the ground, no barriers), driving straight away (no lights)', o.id === 'toskana' && o.cars === 1 && o.ground && o.free && o.mk && o.hud, JSON.stringify(o) + ' in ' + (Date.now() - t0) + ' ms');
    const hm = await page.evaluate(() => { const H = window.__H3.home, P = window.__game.race.player; return { x: H.x, z: H.z, h: P.h }; });
    T.check('the car starts at HOME (on the dirt road south of the start straight, where a mission ends), facing the track', Math.hypot(o.x - hm.x, o.z - hm.z) < 1 && Math.abs(hm.x + 8) < 6 && hm.z > 185 && hm.z < 215 && Math.sin(hm.h) < -0.8, JSON.stringify({ ...o, home: hm }));
    // free driving: a few seconds of throttle move the car; off the road it is not stopped by the barriers
    const d = await page.evaluate(() => { const g = window.__game, P = g.race.player, x0 = P.x, z0 = P.z; g.sim(3, false); return Math.hypot(P.x - x0, P.z - z0); });
    T.check('throttle: the car drives off', d > 5, d.toFixed(1) + ' m');
    const f = await page.evaluate(() => { const g = window.__game, P = g.race.player, T = g.race.track; P.place(40, 20, 0); P.vx = P.vz = 0; g.sim(1.5, false); return { x: P.x, z: P.z, q: P.q.d, w: T.w }; });
    T.check('in the infield, far from the road, the car drives on (no barrier pulls it back)', Math.abs(f.q) > f.w + 20 && Math.hypot(f.x - 40, f.z - 20) > 2, JSON.stringify(f));
    const h = await page.evaluate(() => { const g = window.__game, P = g.race.player, T = g.race.track; P.place(-205, -105, 0); P.vx = P.vz = 0; g.sim(0.5, false); return { y: P.y, ry: P.roadY, g: T.ground2(P.x, P.z) }; });
    T.check('on the snow hill the car stands on the new map\'s ground (its top 25 m and more above the track)', h.g > 20 && Math.abs(h.ry - h.g) < 0.5 && h.y > 20, JSON.stringify(h));
    const e = await page.evaluate(() => { const g = window.__game, P = g.race.player; P.place(405, 0, 0); P.vx = 30; P.vz = 0; g.sim(1, false); return { x: P.x, edge: g.race.track.free[1] }; });
    T.check('the map\'s edge (the buoys at sea) stops the car', e.x <= e.edge + 0.01, JSON.stringify(e));
    T.check('no errors on the way', !errors.length, errors.slice(0, 3).join(' | '));
    // back to the title: the page again (the new map changed the track's world)
    await Promise.all([page.waitForEvent('load', { timeout: 60000 }), page.evaluate(() => __game.onAction('to-title'))]);
    await ready(page);
    T.check('back to the title: the page loads again, the menu on show', await page.evaluate(() => !!document.getElementById('menu-host').shadowRoot.querySelector('#s-title')));
    await ctx.close();
  }
} finally {
  await browser.close(); await srv.close();
}
T.done();
