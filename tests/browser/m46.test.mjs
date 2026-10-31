// Special mission 46 · Požar v predoru (js/missions/m46.js, the kit js/missions/kit.js) in the browser, upright (360 x 640): ?misija=46 on
// Uncompahgre, the fire engine; the tunnel (walls, roof, portals), the trapped cars and the lorry in the scene; the panel (VIDLJIVOST V
// DIMU, ZRAK V JEKLENKAH, REŠENI, DO OGNJA), no timing tower; outside: no smoke, the roof drawn; inside: the smoke over the scene (under
// the HUD), the hazard lamps and the exit signs shining through it, the roof not drawn; a driver to each car (stopped: its people aboard),
// before the lorry: the crew puts it out (GASI, the water on each flame), out of the far portal: done. Back to the title: the tunnel and the
// smoke gone. No errors on the page.
//   node tests/browser/m46.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('m46');
const srv = await serve();
const browser = await launch();
const ready = (page) => page.waitForFunction(() => window.__game.race && typeof Missions !== 'undefined' && Missions.run && window.__game.phase !== 'none', null, { timeout: 240000 });
const st = (page) => page.evaluate(() => { const g = window.__game, R = g.race, r = Missions.run, P = R.player, m = document.getElementById('mis'), sm = document.getElementById('mis-smoke'), vis = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden' && e.getBoundingClientRect().width > 0; };
  return { track: R.track.def.id, car: P.m.id, stage: r && r.stage, run: r && { end: r.end, why: r.why, aboard: r.aboard, f: r.f }, rows: m ? [...m.querySelectorAll('.mis-row')].map(e => e.innerText.replace(/\s+/g, ' ').trim()) : [], tower: vis('#tw-strip') || vis('#h-tower'),
    smoke: sm ? +getComputedStyle(sm).opacity : -1, underHud: !!sm && sm.parentNode === document.getElementById('hud').parentNode && sm.compareDocumentPosition(document.getElementById('hud')) & Node.DOCUMENT_POSITION_FOLLOWING, roof: r && r.tun ? r.tun.roof.visible : null,
    haz: document.querySelectorAll('#mis-dots i.haz').length, exit: document.querySelectorAll('#mis-dots i.exit').length, res: document.getElementById('mis-res') && document.getElementById('mis-res').innerText.replace(/\s+/g, ' ') }; });
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?misija=46', {}, { width: 360, height: 640 }, { touch: true });
  await ready(page); await page.waitForTimeout(300);
  let s = await st(page);
  T.check('?misija=46: Uncompahgre, the fire engine', s.track === 'uncompahgre' && s.car === 'titan', JSON.stringify({ track: s.track, car: s.car }));
  T.check('the panel: VIDLJIVOST V DIMU 6 m, ZRAK V JEKLENKAH, REŠENI 0 / 5, DO OGNJA; no timing tower', s.rows[0] === 'VIDLJIVOST V DIMU 6 m' && /^ZRAK V JEKLENKAH še [\d,]+ min$/.test(s.rows[1]) && s.rows[2] === 'REŠENI 0 / 5' && /^DO OGNJA \d+ m$/.test(s.rows[3]) && !s.tower, JSON.stringify(s.rows));
  const S = await page.evaluate(() => { const r = Missions.run; return { tun: !!r.tun.walls.parent && !!r.tun.roof.parent, cars: r.cars.filter(c => c.m && c.m.parent).length, id: r.tun.walls.id }; });
  T.check('the tunnel and the four trapped cars in the scene', S.tun && S.cars === 4, JSON.stringify(S));
  T.check('outside: no smoke, the roof drawn', s.smoke < 0.05 && s.roof === true, JSON.stringify({ smoke: s.smoke, roof: s.roof }));
  // into the tunnel, a car's length in: the smoke
  await page.evaluate(() => { const g = window.__game, r = Missions.run; for (let k = 0; k < 3000 && !r.end && r.P.q.s < r.s0 + 20; k++) g.sim(0.1, true); g.sim(0.3, false, 0, 0, 1); });
  await page.waitForFunction(() => document.querySelectorAll('#mis-dots i.haz').length > 0 && document.querySelectorAll('#mis-dots i.exit').length > 0, null, { timeout: 8000 }).catch(() => {});   // (the camera settled behind the truck)
  s = await st(page);
  T.check('inside: the smoke over the scene (under the HUD), the hazard lamps and exit signs through it, the roof not drawn', s.smoke > 0.5 && s.underHud && s.haz > 0 && s.exit > 0 && s.roof === false, JSON.stringify({ smoke: s.smoke, under: s.underHud, haz: s.haz, exit: s.exit, roof: s.roof }));
  // a driver: to each car (stopped beside it), then before the lorry
  await page.evaluate(() => { const g = window.__game, r = Missions.run;
    for (let k = 0; k < 5000 && !r.end && r.stage === 'drive' && r.f > 0; k++) {
      const P = r.P, s = P.q.s, v = Math.hypot(P.vx, P.vz), c = r.cars.find(c => c.n > 0), want = c ? c.s : r.sL - 18;
      Core.aiControl(P, g.race, 0.05); const ds = want - s, vt = Math.min(12, Math.abs(ds) * 0.4);
      let thr = 0, brk = 0; if (ds > 2) { if (v < vt) thr = 0.6; else brk = 0.6; } else brk = 1;
      g.sim(0.1, false, P.inSteer, thr, brk);
    } });
  s = await st(page);
  T.check('every car: everyone aboard; before the lorry: the crew works', s.run.aboard === 5 && s.stage === 'fight', JSON.stringify({ run: s.run, stage: s.stage }));
  await page.evaluate(() => { const g = window.__game, r = Missions.run; for (let k = 0; k < r.flP.length && !r.end; k++) { const p = r.flP[k]; r.autoSpray = new THREE.Vector3(p[0], p[1], p[2]); for (let i = 0; i < 40 && r.fl[k] > 0; i++) g.sim(0.25, false, 0, 0, 0); } r.autoSpray = null; });
  s = await st(page);
  T.check('the lorry\'s fire out: driving again, the smoke thinner', s.run.f === 0 && s.stage === 'drive' && s.rows[0] === 'VIDLJIVOST V DIMU 30 m', JSON.stringify({ run: s.run, rows: s.rows }));
  await page.evaluate(() => { const g = window.__game, r = Missions.run; for (let k = 0; k < 600 && !r.end; k++) g.sim(0.1, true); });
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('out of the far portal with everyone: done', s.run.end === 'win' && /MISIJA OPRAVLJENA/.test(s.res), JSON.stringify({ run: s.run, res: s.res }));
  await page.click('#mis-res [data-mis="title"]'); await page.waitForTimeout(600);
  const gone = await page.evaluate((id) => ({ tun: !Render.scene.getObjectById(id), smoke: !document.getElementById('mis-smoke'), dots: !document.getElementById('mis-dots') }), S.id);
  T.check('back to the title: the tunnel and the smoke gone', gone.tun && gone.smoke && gone.dots, JSON.stringify(gone));
  T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
T.done();
