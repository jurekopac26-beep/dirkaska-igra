// Special mission 33 · Odvoz snega (js/missions/m33.js, the kit js/missions/kit.js) in the browser, upright (360 x 640, touch): ?misija=33
// on Montréal, at night in the snow; the panel (CUREK, KIPER, POLNI KIPERJI), no timing tower; in the scene the blower, the snow's arc,
// the banks, the dump truck's own body (the car's hidden); the blower waits for the truck; a driver in the left lane beside it, its box
// under the arc: the box fills (the heap in it), full trucks counted, K.NEED of them: done. A second run: into the blower fast: failed.
// Back to the title: the mission's things gone. No errors on the page.
//   node tests/browser/m33.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('m33');
const srv = await serve();
const browser = await launch();
const ready = (page) => page.waitForFunction(() => window.__game.race && typeof Missions !== 'undefined' && Missions.run && window.__game.phase !== 'none', null, { timeout: 240000 });
const st = (page) => page.evaluate(() => { const g = window.__game, R = g.race, r = Missions.run, m = document.getElementById('mis'), vis = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; };
  return { track: R.track.def.id, atmos: Render.atmos, run: r && { end: r.end, why: r.why, t: r.t, fill: r.fill, full: r.full, fs: r.fs, hit: r.hit }, rows: m ? [...m.querySelectorAll('.mis-row')].map(e => e.innerText.replace(/\s+/g, ' ').trim()) : [],
    tower: vis('#tw-strip') || vis('#h-tower'), res: document.getElementById('mis-res') && document.getElementById('mis-res').innerText.replace(/\s+/g, ' ') }; });
// a driver: to a point 8 m ahead in the lane `want` m right of the centre (null: the truck's lane beside the blower), the speed to bring
// the box under the arc (or vmax); until cond(r) or the end
const drive = (page, cond, maxT, want, vmax) => page.evaluate(([cond, maxT, want, vmax]) => {
  const g = window.__game, r = Missions.run, K = r.def.K, Tr = g.race.track, f = new Function('r', 'return ' + cond), t0 = r.t; let hit = 0, n = 0, heap = 0;
  const lane = want == null ? K.LANE - K.SIDE : want;
  for (let k = 0; k < 40000 && !r.end && r.t - t0 < maxT && !f(r); k++) {
    const P = r.P, i = Tr.idx(P.q.s + 8), x = Tr.px[i] + Tr.nx[i] * lane, z = Tr.pz[i] + Tr.nz[i] * lane;
    let e = Math.atan2(z - P.z, x - P.x) - P.h; e = Math.atan2(Math.sin(e), Math.cos(e));
    const v = Math.hypot(P.vx, P.vz), vt = vmax != null ? vmax : Math.max(0, K.VF + (r.near ? 0.8 * r.e[0] : 3));
    let thr = 0, brk = 0; if (v < vt) thr = 0.7; else if (v > vt + 0.5) brk = 0.5;
    g.sim(0.05, false, Math.max(-1, Math.min(1, e * 2.5)), thr, brk);
    n++; if (r.hit) hit++; if (r.heap && r.heap.visible) heap++;
  }
  return { t: r.t, end: r.end, full: r.full, fill: r.fill, hit, n, heap };
}, [cond, maxT, want, vmax]);
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?misija=33', {}, { width: 360, height: 640 }, { touch: true });
  await ready(page); await page.waitForTimeout(300);
  let s = await st(page);
  T.check('?misija=33: Montréal, winter at night', s.track === 'montreal' && s.atmos.season === 'winter' && s.atmos.tod === 'night', JSON.stringify({ track: s.track, atmos: s.atmos }));
  T.check('the panel: CUREK, KIPER 0 %, POLNI KIPERJI 0 / 4; no timing tower', /^CUREK /.test(s.rows[0]) && s.rows[1] === 'KIPER 0 %' && s.rows[2] === 'POLNI KIPERJI 0 / 4' && !s.tower, JSON.stringify(s.rows));
  const S = await page.evaluate(() => { const r = Missions.run, has = (o) => !!o && !!Render.scene.getObjectById(o.id), v = Render.viewOf(r.P);
    return { blower: has(r.bl), banks: r.banks.length > 8 && r.banks.every(b => has(b.m)), skin: !!r.skin && !!r.skin.parent, heap: !!r.heap, body: v.body.visible }; });
  T.check('in the scene: the blower, the banks, the dump truck\'s own body with its heap (the car\'s hidden)', S.blower && S.banks && S.skin && S.heap && !S.body, JSON.stringify(S));
  // standing back: the blower waits
  const fs0 = s.run.fs; await drive(page, 'false', 4, null, 0); s = await st(page);
  T.check('the truck far behind: the blower waits', Math.abs(s.run.fs - fs0) < 0.01 && !s.run.end, `${fs0} ${s.run.fs}`);
  // beside it: the box fills, the first truck full
  let d = await drive(page, 'r.full >= 1', 150);
  s = await st(page);
  T.check('beside the blower, the box under the arc: it fills, the heap in it; the first truck full', s.run.full === 1 && d.hit > d.n * 0.6 && d.heap > 0 && s.rows[2] === 'POLNI KIPERJI 1 / 4', JSON.stringify({ d, rows: s.rows }));
  d = await drive(page, 'false', 380);
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('four trucks full: done, in time with stars to spare', s.run.end === 'win' && s.run.full === 4 && /MISIJA OPRAVLJENA/.test(s.res) && s.run.t < 330, JSON.stringify({ d, run: s.run, res: s.res }));
  const ids = await page.evaluate(() => [Missions.run.bl.id, Missions.run.banks[0].m.id]);
  await page.click('#mis-res [data-mis="again"]'); await ready(page); await page.waitForTimeout(500);
  // again: into the blower's back, fast
  d = await drive(page, 'false', 40, 2.4, 11);
  s = await st(page);
  T.check('into the blower fast: failed', s.run.end === 'fail' && /frezo/.test(s.run.why), JSON.stringify({ d, run: s.run }));
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  await page.click('#mis-res [data-mis="title"]'); await page.waitForTimeout(600);
  const gone = await page.evaluate((ids) => ({ things: ids.every(id => !Render.scene.getObjectById(id)), run: !Missions.run }), ids);
  T.check('back to the title: the blower and the banks gone', gone.things && gone.run, JSON.stringify(gone));
  T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
T.done();
