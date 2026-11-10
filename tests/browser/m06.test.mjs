// Special mission 06 · Srce v hladilni torbi (js/missions/m06.js) in the browser, upright (360 x 640): ?misija=06 in the Santa Monica Mountains at night,
// the player in the JELEN GT behind the escort (a patrol car in the police's look, its lamps flashing while it leads), the traffic only
// cars, vans and trucks (nobody on foot, no bicycles), pulling over for the escort; the panel (ORGAN, SPREMSTVO, BOLNIŠNICA), no timing
// tower; the hospital at the finish (a white building, a blue H, an ambulance); on the autopilot behind the escort to the top: done. Again, standing still on the
// brake: the escort lost, failed; back to the title, the hospital gone. No errors on the page.
//   node tests/browser/m06.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('m06');
const srv = await serve();
const browser = await launch();
const ready = (page) => page.waitForFunction(() => window.__game.race && typeof Missions !== 'undefined' && Missions.run && window.__game.phase !== 'none', null, { timeout: 240000 });
const st = (page) => page.evaluate(() => { const g = window.__game, R = g.race, r = Missions.run, E = R.escort, tf = R.tf, m = document.getElementById('mis'), vis = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; };
  return { phase: g.phase, track: R.track.def.id, car: R.player.m.id, night: Render.atmos ? Render.atmos.tod : null, esc: E && { m: E.m.id, police: !!E.police, ahead: E.dist - R.player.dist, idx: R.cars.indexOf(E) }, cars: R.cars.length,
    kinds: tf ? [...new Set(tf.veh.filter(v => !v.off).map(v => v.kind))].sort() : null, peds: tf ? tf.ped.length : -1, yl: tf ? tf.veh.filter(v => v.yl === 1).length : 0, run: r && { end: r.end, why: r.why, t: r.t, temp: r.temp },
    rows: m ? [...m.querySelectorAll('.mis-row')].map(e => e.innerText.replace(/\s+/g, ' ').trim()) : [], tower: vis('#tw-strip') || vis('#h-tower'), res: document.getElementById('mis-res') && document.getElementById('mis-res').innerText.replace(/\s+/g, ' ') }; });
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?misija=06', {}, { width: 360, height: 640 }, { touch: true });
  await ready(page); await page.waitForTimeout(300);
  let s = await st(page);
  T.check('?misija=06: the Santa Monica Mountains, the JELEN GT, the escort (VORTEX, police) ahead of the player', s.track === 'mulholland' && s.car === 'jelen' && s.esc && s.esc.m === 'vortex' && s.esc.police && s.esc.ahead > 0 && s.cars === 2, JSON.stringify({ track: s.track, car: s.car, esc: s.esc, cars: s.cars }));
  T.check('at night', s.night === 'night', String(s.night));
  const H = await page.evaluate(() => { const r = Missions.run, g = r.hosp, T = window.__game.race.track; if (!g) return null; const i = T.idx(T.finishS), b = new THREE.Box3().setFromObject(g), c = b.getCenter(new THREE.Vector3());
    return { inScene: !!g.parent, parts: g.children.length, dist: Math.hypot(c.x - T.px[i], c.z - T.pz[i]), id: g.id }; });
  T.check('the hospital at the finish: in the scene, beside the line (a few bodies)', H && H.inScene && H.parts <= 14 && H.dist < 45, JSON.stringify(H));
  T.check('the traffic: cars, vans and trucks only, nobody on foot', s.kinds && s.kinds.length && s.kinds.every(k => k <= 2) && s.peds === 0, JSON.stringify({ kinds: s.kinds, peds: s.peds }));
  T.check('the panel: ORGAN 4,0 °C, SPREMSTVO, BOLNIŠNICA in km; no timing tower', /^ORGAN 4,0 °C$/.test(s.rows[0]) && /^SPREMSTVO \d+ m$/.test(s.rows[1]) && /^BOLNIŠNICA 4,\d km$/.test(s.rows[2]) && !s.tower, JSON.stringify({ rows: s.rows, tower: s.tower }));
  // the autopilot behind the escort, as the mission asks (keep to the police, do not pass it): its own steering, throttle and brake, but
  // off the throttle and on the brake when it would come within 12 m of the escort in under 2 s. The race paused from here on (before the
  // lights go out): it goes on only in these steps, never in the frames between them with no one at the wheel. (The autopilot alone
  // races: it ran into the escort from behind and past it, where the traffic does not pull over, into the cars there; the knocks warmed
  // the organ and slowed the car, and on GitHub three runs in eight failed, the escort lost or the organ past 8 °C.)
  await page.evaluate(() => window.__game.pause());
  const drive = (sec) => page.evaluate((sec) => { const g = window.__game, R = g.race, P = R.player, E = R.escort, r = Missions.run, dt = 1 / 120;
    for (let t = 0; t < sec && !r.end; t += dt) {
      if (g.phase !== 'racing') { g.sim(dt, true); continue; }   // (the start: the autopilot's own, off the gas on the grid)
      Core.aiControl(P, R, dt); let thr = P.inThr, brk = P.inBrk; const gap = E.dist - P.dist, close = P.speed - E.speed;
      if (gap < 12 || (close > 0 && gap - 12 < 2 * close)) { thr = 0; brk = Math.max(brk, Math.min(1, 0.25 + close / 8)); }
      g.sim(dt, false, P.inSteer, thr, brk);
      // (stuck or the wrong way: put back on the road, like a player tapping Na progo. A knock in the traffic can turn the car into the
      // rock or the rail; the autopilot has no reverse gear, and stuck there the escort drives away: more than 300 m for 8 s, lost)
      if (!P.finished && (P.stuckT > 3 || P.wrongT > 3)) R.rescue(P);
    } }, sec);
  let yl = 0; for (let k = 0; k < 6; k++) { await drive(5); yl = Math.max(yl, (await st(page)).yl); }
  const lamps = await page.evaluate(() => { const v = Render.viewOf(window.__game.race.escort); return v ? !!v.polBar : null; });
  T.check('the traffic pulls over for the escort', yl > 0, String(yl));
  if (lamps !== null) T.check('the escort has the light bar', lamps);
  await drive(220); await page.evaluate(() => window.__game.resume());   // (the run over: the game on again, its result over the pause)
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('on the autopilot behind the escort to the top: done (the organ still cold enough)', s.run.end === 'win' && s.run.temp < 8 && /MISIJA OPRAVLJENA/.test(s.res), JSON.stringify({ run: s.run, res: s.res }));
  await page.click('#mis-res [data-mis="again"]'); await ready(page);
  await page.evaluate(() => window.__game.sim(60, false, 0, 0, 1));
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('standing still: the escort lost, failed', s.run.end === 'fail' && /spremstvo/.test(s.run.why) && /MISIJA NEUSPELA/.test(s.res), JSON.stringify({ run: s.run, res: s.res }));
  await page.click('#mis-res [data-mis="title"]'); await page.waitForTimeout(600);
  const gone = await page.evaluate((id) => !Render.scene.getObjectById(id), H && H.id);
  T.check('back to the title: the hospital gone from the scene', gone);
  T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
T.done();
