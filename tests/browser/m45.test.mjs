// Special mission 45 · Turistični vlakec (js/missions/m45.js, the kit js/missions/kit.js) in the browser, upright (360 x 640, touch):
// ?misija=45 on Livorno, the locomotive (the 4x4's physics, its limiter) alone, K.PRE m before the line on the seafront; the panel (OVINEK,
// POTNIKI 36, ZADNJI NA CESTI); the locomotive's skin on the player's car, the three wagons, the parasols, the viewpoint's terrace and the
// yellow box in the scene; the wagons drawn behind where the locomotive is drawn (the first at its coupling, each K.LC m behind the one
// ahead); on the inside of a bend a wagon on the kerb (POTNIKI less, the tag ROBNIK!); wide on to the viewpoint (its tag RAZGLED and the
// metres), stopped in the box: done. Back to the title: the wagons, the parasols, the terrace, the box and the tags gone; no errors.
//   node tests/browser/m45.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('m45');
const srv = await serve();
const browser = await launch();
const ready = (page) => page.waitForFunction(() => window.__game.race && typeof Missions !== 'undefined' && Missions.run && window.__game.phase !== 'none', null, { timeout: 240000 });
const st = (page) => page.evaluate(() => { const g = window.__game, R = g.race, r = Missions.run, m = document.getElementById('mis');
  return { track: R.track.def.id, car: R.player.m.id, vLim: R.player.m.vLim, ai: R.cars.length - 1, dist: R.player.dist, run: r && { end: r.end, why: r.why, hits: r.hits, happy: r.happy, stars: r.stars }, rows: m ? [...m.querySelectorAll('.mis-row')].map(e => e.innerText.replace(/\s+/g, ' ').trim()) : [],
    tag: (document.getElementById('mis-tags') || {}).innerText || '', res: document.getElementById('mis-res') && document.getElementById('mis-res').innerText.replace(/\s+/g, ' ') }; });
// (o.stop: then braked to a standstill, so the real frames between the calls change nothing)
const drive = (page, cond, maxT, o) => page.evaluate(([cond, maxT, o]) => {
  const g = window.__game, r = Missions.run, f = new Function('r', 'return ' + cond), t0 = r.t, v = () => Math.hypot(r.P.vx, r.P.vz);
  for (let k = 0; k < 40000 && !r.end && r.t - t0 < maxT && !f(r); k++) { const a = r.def.pilot(r, o || {}); g.sim(0.05, false, a[0], a[1], a[2]); }
  if (o && o.stop) for (let k = 0; k < 100 && !r.end && v() > 0.3; k++) g.sim(0.05, false, 0, 0, 1);
  return { t: r.t, end: r.end, dist: r.P.dist, hits: r.hits };
}, [cond, maxT, o]);
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?misija=45', {}, { width: 360, height: 640 }, { touch: true });
  await ready(page); await page.waitForTimeout(300);
  await page.waitForFunction(() => { const e = document.querySelector('#mis .mis-row'); return e && e.innerText.trim() !== ''; }, null, { timeout: 60000 });   // (the panel shown once the start's intro is over)
  let s = await st(page);
  const K = await page.evaluate(() => Missions.run.def.K);
  T.check('?misija=45: Livorno, the locomotive (the 4x4, its limiter) alone, K.PRE m before the line', s.track === 'livorno' && s.car === 'medved' && s.vLim === K.VMAX * 3.6 && s.ai === 0 && s.dist < -K.PRE + 40, JSON.stringify({ track: s.track, car: s.car, vLim: s.vLim, ai: s.ai, dist: s.dist }));
  T.check('the panel: OVINEK (the bend on the seafront), POTNIKI 36, ZADNJI NA CESTI', /^OVINEK LEVI · \d+ m$/.test(s.rows[0]) && s.rows[1] === 'POTNIKI 36' && s.rows[2] === 'ZADNJI NA CESTI', JSON.stringify(s.rows));
  const S = await page.evaluate(() => { const r = Missions.run, f = r.fx, inS = (o) => !!o && !!Render.scene.getObjectById(o.id), v = Render.viewOf(r.P);
    return { skin: !!r.skin && r.skin.parent === v.bodyG && !v.body.visible, wag: f.wag.length === 3 && f.wag.every(inS), beach: f.beach, par: inS(f.par), view: inS(f.view), box: inS(f.box), ids: f.wag.map(m => m.id).concat([f.par.id, f.view.id, f.box.id]) }; });
  T.check('the locomotive\'s skin on the player\'s car; the three wagons, the parasols, the terrace and the yellow box in the scene', S.skin && S.wag && S.beach >= 20 && S.par && S.view && S.box, JSON.stringify(S));
  await drive(page, 'r.P.dist > -120', 30);
  await page.waitForTimeout(400);
  const W = await page.evaluate(() => { const r = Missions.run, f = r.fx, K = r.def.K, g = Render.viewOf(r.P).grp, h = -g.rotation.y, cx = g.position.x - Math.cos(h) * K.C0, cz = g.position.z - Math.sin(h) * K.C0;
    const p = f.wag.map(m => [m.position.x, m.position.z]); return { c0: Math.hypot(p[0][0] - cx, p[0][1] - cz), gaps: [1, 2].map(k => Math.hypot(p[k][0] - p[k - 1][0], p[k][1] - p[k - 1][1])) }; });
  T.check('the wagons drawn behind the locomotive: the first at its coupling, each K.LC m behind the one ahead', W.c0 < 0.05 && W.gaps.every(d => Math.abs(d - K.LC) < 0.05), JSON.stringify(W));
  // on the inside of the bends: a wagon on the kerb
  let d = await drive(page, 'r.hits > 0', 120, { cut: true, stop: true });
  s = await st(page);
  const tagHit = s.tag;
  // (the game runs on in real frames between the calls: the panel and the run read together, in one)
  T.check('on the inside of a bend: a wagon on the kerb, POTNIKI less, the tag ROBNIK!', d.hits >= 1 && s.run.hits >= d.hits && s.run.happy === K.P0 - K.HIT * s.run.hits && s.rows[1] === 'POTNIKI ' + s.run.happy && /ROBNIK!/.test(tagHit), JSON.stringify({ d, run: s.run, rows: s.rows, tag: tagHit }));
  // wide on to the viewpoint
  d = await drive(page, 'r.P.dist > r.def.K.STOP - 120', 600);
  await page.waitForTimeout(500);
  s = await st(page);
  T.check('by the viewpoint: its tag (RAZGLED and the metres), OVINEK —', /RAZGLED\s*\d+ m/.test(s.tag) && s.rows[0] === 'OVINEK —', s.tag + ' ' + JSON.stringify(s.rows) + ' ' + JSON.stringify(d));
  d = await drive(page, 'false', 120);
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('stopped in the yellow box: done', s.run.end === 'win' && s.run.stars >= 1 && /MISIJA OPRAVLJENA/.test(s.res), JSON.stringify({ d, run: s.run, res: s.res }));
  await page.click('#mis-res [data-mis="title"]'); await page.waitForTimeout(600);
  const gone = await page.evaluate((ids) => ({ objs: ids.every(id => !Render.scene.getObjectById(id)), run: !Missions.run, tags: !document.getElementById('mis-tags') }), S.ids);
  T.check('back to the title: the wagons, the parasols, the terrace, the box and the tags gone', gone.objs && gone.run && gone.tags, JSON.stringify(gone));
  T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
T.done();
