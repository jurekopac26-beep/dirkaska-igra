// Special mission 47 · Gozdni požar (js/missions/m47.js, the kit js/missions/kit.js) in the browser, upright (360 x 640): ?misija=47 on the
// Great Alpine Road at dusk, the fire engine; the panel (VODA, OGENJ DO HIŠE, VETER, POGAŠENO), no timing tower; the fire's flames, the
// house, the pond and the kangaroos in the scene; near the fire the pad and GASI shown with the driving controls kept (aimed while
// driving); a driver along the fire (slowly, the water on the nearest cell, to the pond when dry): every cell out, done. Back to the title:
// the fire and the pad gone. No errors on the page.
//   node tests/browser/m47.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('m47');
const srv = await serve();
const browser = await launch();
const ready = (page) => page.waitForFunction(() => window.__game.race && typeof Missions !== 'undefined' && Missions.run && window.__game.phase !== 'none', null, { timeout: 240000 });
const st = (page) => page.evaluate(() => { const g = window.__game, R = g.race, r = Missions.run, P = R.player, m = document.getElementById('mis'), vis = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden' && e.getBoundingClientRect().width > 0; };
  return { track: R.track.def.id, car: P.m.id, dusk: Render.atmos.tod, run: r && { end: r.end, why: r.why, water: r.water }, rows: m ? [...m.querySelectorAll('.mis-row')].map(e => e.innerText.replace(/\s+/g, ' ').trim()) : [], tower: vis('#tw-strip') || vis('#h-tower'),
    pad: vis('#mis-aim'), drive: !!document.querySelector('#mis-aim.drive'), gasi: vis('#mis-aim .gasi'), touch: vis('#touch'), res: document.getElementById('mis-res') && document.getElementById('mis-res').innerText.replace(/\s+/g, ' ') }; });
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?misija=47', {}, { width: 360, height: 640 }, { touch: true });
  await ready(page); await page.waitForTimeout(300);
  let s = await st(page);
  T.check('?misija=47: the Great Alpine Road at dusk, the fire engine', s.track === 'greatalpine' && s.car === 'titan' && s.dusk === 'dusk', JSON.stringify({ track: s.track, car: s.car, tod: s.dusk }));
  T.check('the panel: VODA, OGENJ DO HIŠE, VETER 35 km/h, POGAŠENO 0 %; no timing tower', /^VODA \d+ l$/.test(s.rows[0]) && /^OGENJ DO HIŠE \d+ m$/.test(s.rows[1]) && s.rows[2] === 'VETER 35 km/h' && s.rows[3] === 'POGAŠENO 0 %' && !s.tower, JSON.stringify(s.rows));
  const S = await page.evaluate(() => { const r = Missions.run; return { fire: !!r.fire.flames.P.parent, house: !!r.H.g.parent, roos: r.roos.length, id: r.fire.flames.P.id }; });
  T.check('the fire, the house and three kangaroos in the scene', S.fire && S.house && S.roos === 3, JSON.stringify(S));
  await page.evaluate(() => { const g = window.__game, r = Missions.run; for (let k = 0; k < 3000 && !r.end && r.P.q.s < r.s1 - 60; k++) g.sim(0.25, true); });
  s = await st(page);
  T.check('near the fire: the pad and GASI shown, the driving controls kept', s.pad && s.drive && s.gasi && s.touch, JSON.stringify({ pad: s.pad, drive: s.drive, gasi: s.gasi, touch: s.touch }));
  // a driver along the fire: slowly to the first burning cell, the water on the nearest one in reach, to the pond when dry
  await page.evaluate(() => { const g = window.__game, r = Missions.run, K = r.def.K;
    for (let k = 0; k < 6000 && !r.end; k++) {
      const P = r.P, s = P.q.s, v = Math.hypot(P.vx, P.vz); let goal = null, gs = 1e9, sp = null, sd = 1e9;
      for (const c of r.cells) if (c.f > 0) { if (c.s < gs) { gs = c.s; goal = c; } const d = Math.hypot(c.x - P.x, c.z - P.z); if (d < sd) { sd = d; sp = c; } }
      const dry = r.water < 60 || (r.filling && r.water < K.WATER - 10), want = dry ? r.sP : goal ? goal.s : s;
      r.autoSpray = !dry && sp && sd < K.RANGE - 4 ? new THREE.Vector3(sp.x, sp.y, sp.z) : null;
      Core.aiControl(P, g.race, 0.05);
      const ds = want - s, vt = Math.min(dry ? 20 : 6, Math.abs(ds) * 0.5);
      let thr = 0, brk = 0; if (ds > 3) { if (v < vt) thr = 0.6; else brk = 0.5; } else if (ds < -3) brk = 0.6; else brk = v > 0.5 ? 1 : 0;
      g.sim(0.1, false, P.inSteer * (P.gear < 0 ? -1 : 1), thr, brk);
    } });
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('every cell out: done', s.run.end === 'win' && /MISIJA OPRAVLJENA/.test(s.res) && s.rows[3] === 'POGAŠENO 100 %', JSON.stringify({ run: s.run, res: s.res, rows: s.rows }));
  await page.click('#mis-res [data-mis="title"]'); await page.waitForTimeout(600);
  const gone = await page.evaluate((id) => ({ fire: !Render.scene.getObjectById(id), pad: !document.getElementById('mis-aim') }), S.id);
  T.check('back to the title: the fire and the pad gone', gone.fire && gone.pad, JSON.stringify(gone));
  T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
T.done();
