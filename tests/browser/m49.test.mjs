// Special mission 49 · Zataknjeno kolo (js/missions/m49.js, the kit js/missions/kit.js) in the browser, upright (360 x 640): ?misija=49 on
// Suzuka, the aerial ladder (its own body on the racing truck's physics); the wheel beside the West straight in the scene; the panel
// (DOLŽINA, KOT, NIHANJE KOŠA, REŠENI, V KOŠU), no timing tower; on the autopilot to the wheel and stopped: the finger's pad shown (the
// driving controls hidden), the tags over the cabins with people; the finger held on a cabin (a real press): the ladder follows; the ladder
// at each cabin in turn (solved), the basket down when full: everyone on the ground, done. Back to the title: the wheel and the pad gone.
//   node tests/browser/m49.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('m49');
const srv = await serve();
const browser = await launch();
const ready = (page) => page.waitForFunction(() => window.__game.race && typeof Missions !== 'undefined' && Missions.run && window.__game.phase !== 'none', null, { timeout: 240000 });
const st = (page) => page.evaluate(() => { const g = window.__game, R = g.race, r = Missions.run, P = R.player, m = document.getElementById('mis'), vis = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden' && e.getBoundingClientRect().width > 0; };
  return { track: R.track.def.id, car: P.m.id, stage: r && r.stage, run: r && { end: r.end, why: r.why, saved: r.saved, inB: r.inB }, lift: r && r.truck.lift, ext: r && r.truck.ext,
    rows: m ? [...m.querySelectorAll('.mis-row')].map(e => e.innerText.replace(/\s+/g, ' ').trim()) : [], tower: vis('#tw-strip') || vis('#h-tower'), lad: vis('#mis-aim'), touch: vis('#touch'), tags: document.querySelectorAll('#mis-tags.on i').length,
    res: document.getElementById('mis-res') && document.getElementById('mis-res').innerText.replace(/\s+/g, ' ') }; });
const solve = (page) => page.evaluate(() => { const r = Missions.run, tk = r.truck, c = Missions.cur.target(r); if (!c) return null; let best = [1e9, 0, 0]; const L0 = tk.lift, E0 = tk.ext;
  for (let a = 0; a <= 1.0001; a += 0.02) for (let e = 0; e <= 1.0001; e += 0.02) { tk.lift = a * r.def.K.LIFT; tk.ext = e; const t = tk.tipAt(); const d = Math.hypot(t.x - c.x, t.y - c.y, t.z - c.z); if (d < best[0]) best = [d, a, e]; }
  tk.lift = L0; tk.ext = E0; tk.step(0, true); r.auto = { lift: best[1], ext: best[2] }; return best[0]; });
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?misija=49', {}, { width: 360, height: 640 }, { touch: true });
  await ready(page); await page.waitForTimeout(300);
  let s = await st(page);
  T.check('?misija=49: Suzuka, the aerial ladder', s.track === 'suzuka' && s.car === 'titan', JSON.stringify({ track: s.track, car: s.car }));
  T.check('the panel: DOLŽINA 7,2 m, KOT 0°, NIHANJE KOŠA, REŠENI 0 / 16, V KOŠU 0 / 4; no timing tower', s.rows[0] === 'DOLŽINA 7,2 m' && s.rows[1] === 'KOT 0°' && /^NIHANJE KOŠA/.test(s.rows[2]) && s.rows[3] === 'REŠENI 0 / 16' && s.rows[4] === 'V KOŠU 0 / 4' && !s.tower, JSON.stringify(s.rows));
  const W = await page.evaluate(() => { const r = Missions.run; return { inScene: !!r.W.g.parent, id: r.W.g.id }; });
  T.check('the wheel in the scene', W.inScene);
  // on the autopilot to the wheel, then on the brake (the autopilot's steering) until the crew starts
  await page.evaluate(() => { const g = window.__game, r = Missions.run, T = g.race.track, dOf = () => { let d = r.P.q.s - (r.sW - r.def.K.AHEAD); if (d > T.len / 2) d -= T.len; if (d < -T.len / 2) d += T.len; return d; };
    for (let k = 0; k < 4000 && !r.end; k++) { const d = dOf(); if (d > -60 && d < 0 && r.t > 5) break; g.sim(0.25, true); }
    for (let k = 0; k < 300 && r.stage === 'drive' && !r.end; k++) { const d = dOf(), v = Math.hypot(r.P.vx, r.P.vz); Core.aiControl(r.P, g.race, 0.05); if (d < -35) g.sim(0.1, true); else g.sim(0.1, false, r.P.inSteer, v > 5 ? 0 : 0.35, v > 5 ? 1 : 0); } });
  await page.evaluate(() => window.__game.sim(1, false, 0, 0, 0));
  await page.waitForFunction(() => document.querySelectorAll('#mis-tags.on i').length > 0, null, { timeout: 8000 }).catch(() => {});   // (the camera settled behind the truck)
  s = await st(page);
  T.check('stopped by the wheel: the finger\'s pad shown, the driving controls hidden, the cabins tagged', s.stage === 'ladder' && s.lad && !s.touch && s.tags > 0, JSON.stringify({ stage: s.stage, lad: s.lad, touch: s.touch, tags: s.tags }));
  // the finger on a cabin (a real press where it is on the screen, held): the basket follows it, the ladder turns, rises and extends
  await page.waitForFunction(() => Math.abs(Render.cam.gy - Missions.run.P.y) < 1.5, null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(600);
  const cp = await page.evaluate(() => { const r = Missions.run, c = Missions.cur.target(r), v = new THREE.Vector3(c.x, c.y, c.z).project(Render.camera); return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight }; });
  await page.mouse.move(cp.x, cp.y); await page.mouse.down();
  await page.evaluate(() => window.__game.sim(3, false, 0, 0, 0));
  await page.mouse.up();
  s = await st(page);
  T.check('the finger on a cabin: the ladder rises and extends toward it', s.lift > 0.3 && s.ext > 0.1, `${s.lift} ${s.ext} ${JSON.stringify(cp)}`);
  // every cabin in turn (the ladder solved for it), the basket down when full
  let worst = 0;
  for (let trip = 0; trip < 16; trip++) {
    const q = await page.evaluate(() => { const r = Missions.run; return { inB: r.inB, end: r.end, t: !!Missions.cur.target(r) }; });
    if (q.end) break;
    if (q.inB >= 4 || (!q.t && q.inB > 0)) await page.evaluate(() => { Missions.run.auto = { lift: 0, ext: 0 }; window.__game.sim(14, false, 0, 0, 0); });
    else { await page.evaluate(() => window.__game.sim(4, false, 0, 0, 0)); worst = Math.max(worst, await solve(page)); await page.evaluate(() => { const g = window.__game, r = Missions.run, n = r.inB; for (let k = 0; k < 120 && r.inB === n; k++) g.sim(0.25, false, 0, 0, 0); }); }
  }
  T.check('every cabin within the ladder\'s reach', worst < 1, worst.toFixed(2));
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('everyone on the ground: done', s.run.end === 'win' && s.run.saved === 16 && /MISIJA OPRAVLJENA/.test(s.res), JSON.stringify({ run: s.run, res: s.res }));
  await page.click('#mis-res [data-mis="title"]'); await page.waitForTimeout(600);
  const gone = await page.evaluate((id) => ({ wheel: !Render.scene.getObjectById(id), lad: !document.getElementById('mis-aim'), tags: !document.getElementById('mis-tags') }), W.id);
  T.check('back to the title: the wheel, the finger\'s pad and the tags gone', gone.wheel && gone.lad && gone.tags, JSON.stringify(gone));
  T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
T.done();
