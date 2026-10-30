// Special mission 19 · Pred plimo (js/missions/m19.js, the kit js/missions/kit.js) in the browser, upright (360 x 640, touch): ?misija=19
// on Townsville in the doctor's MEDVED; the panel (MORJE, OTOK, ZDRAVNIK), no timing tower; the tide's water (the creek's own look), the
// island (left of the road, in the creek) with its footbridge, the lifeguard towers and the yellow stop box, the doctor and the fisherman,
// the tags in the scene; a driver to the stop box, stopped (the island ahead on the screen): the doctor walks over, treats the fisherman and walks back (the car held meanwhile); the tide on the low road by then;
// on to the dry past Turn 1: done. Back to the title: the water, the island and the tags gone. No errors on the page.
//   node tests/browser/m19.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('m19');
const srv = await serve();
const browser = await launch();
const ready = (page) => page.waitForFunction(() => window.__game.race && typeof Missions !== 'undefined' && Missions.run && window.__game.phase !== 'none', null, { timeout: 240000 });
const st = (page) => page.evaluate(() => { const g = window.__game, R = g.race, r = Missions.run, P = R.player, m = document.getElementById('mis'), vis = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden' && e.getBoundingClientRect().width > 0; };
  return { track: R.track.def.id, car: P.m.id, run: r && { end: r.end, why: r.why, doc: r.doc, depth: r.depth, lvl: r.lvl, t: r.t, locked: !!P.locked }, rows: m ? [...m.querySelectorAll('.mis-row')].map(e => e.innerText.replace(/\s+/g, ' ').trim()) : [],
    tower: vis('#tw-strip') || vis('#h-tower'), tags: !!document.getElementById('mis-tags'), res: document.getElementById('mis-res') && document.getElementById('mis-res').innerText.replace(/\s+/g, ' ') }; });
// a driver: the autopilot's steering, the pedals to reach s (m from the start line) at most v m/s and stop there; until cond(r) or end
const drive = (page, cond, want, vmax, maxT) => page.evaluate(([cond, want, vmax, maxT]) => {
  const g = window.__game, r = Missions.run, L = g.race.track.len, sg = (s) => (s > L / 2 ? s - L : s), f = new Function('r', 's', 'return ' + cond), t0 = r.t;
  for (let k = 0; k < 20000 && !r.end && r.t - t0 < maxT && !f(r, sg(r.P.q.s)); k++) {
    const P = r.P, s = sg(P.q.s), v = Math.hypot(P.vx, P.vz), ds = want - s, vt = Math.min(vmax, Math.abs(ds) * 0.35 + 0.5);
    Core.aiControl(P, g.race, 0.05);
    let thr = 0, brk = 0; if (vmax > 0 && ds > 2) { if (v < vt) thr = 0.8; else brk = 0.4; } else brk = v > 0.3 ? 1 : 0;
    g.sim(0.1, false, P.inSteer * (P.gear < 0 ? -1 : 1), thr, brk);
  }
  return { s: sg(r.P.q.s), t: r.t, doc: r.doc, end: r.end };
}, [cond, want, vmax, maxT]);
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?misija=19', {}, { width: 360, height: 640 }, { touch: true });
  await ready(page); await page.waitForTimeout(300);
  let s = await st(page);
  T.check('?misija=19: Townsville, the MEDVED', s.track === 'townsville' && s.car === 'medved', JSON.stringify({ track: s.track, car: s.car }));
  T.check('the panel: MORJE 0,5 m pod cesto, OTOK in m, ZDRAVNIK v avtu; no timing tower', s.rows[0] === 'MORJE 0,5 m pod cesto' && /^OTOK \d+ m$/.test(s.rows[1]) && s.rows[2] === 'ZDRAVNIK v avtu' && !s.tower, JSON.stringify(s.rows));
  const S = await page.evaluate(() => { const r = Missions.run, ids = (r.props || []).map(o => o.id), W = r.W.mesh, has = (o) => !!o && !!Render.scene.getObjectById(o.id);
    // the island stands in the creek: the sand's top above the tide's top, its foot under the creek's water
    const isl = r.props.find(o => o.isMesh && o.geometry && o.geometry.boundingBox !== undefined && Math.hypot(o.position.x - r.isl.x, o.position.z - r.isl.z) < 0.5);
    if (isl) isl.geometry.computeBoundingBox();
    return { water: has(W), creekLook: !!W.material.map && W.material.transparent, island: !!isl, bb: isl ? [isl.geometry.boundingBox.min.y, isl.geometry.boundingBox.max.y] : null, crowd: has(r.crowd.g), tags: !!document.getElementById('mis-tags'), n: ids.length, wid: W.id }; });
  T.check('in the scene: the tide\'s water (the creek\'s look), the island in the creek (its foot under the water), the people, the tags', S.water && S.creekLook && S.island && S.bb[0] < -2.7 && S.bb[1] > 0.9 && S.crowd && S.tags, JSON.stringify(S));
  // to the yellow box before the footbridge, stopped: the doctor goes; the island ahead on the screen (not under the panel)
  const STOP = await page.evaluate(() => Missions.run.def.K.STOP);
  let d = await drive(page, "r.doc !== 'car'", STOP, 20, 120);
  s = await st(page);
  T.check('stopped in the box: the doctor out, the car held, OTOK tukaj', s.run.doc === 'out' && s.run.locked && s.rows[1] === 'OTOK tukaj' && s.rows[2] === 'ZDRAVNIK na brvi', JSON.stringify({ d, rows: s.rows }));
  // (the chase camera swings round after the stop: measured until it has settled, up to 4 s)
  const look = () => page.evaluate(() => { const r = Missions.run, v = new THREE.Vector3(r.isl.x, 2, r.isl.z).project(Render.camera), c = document.getElementById('gl') || document.querySelector('canvas'), b = c.getBoundingClientRect();
    const px = { x: b.left + (v.x + 1) / 2 * b.width, y: b.top + (1 - v.y) / 2 * b.height }, hit = (sel) => { const e = document.querySelector(sel); if (!e) return false; const q = e.getBoundingClientRect(); return px.x >= q.left && px.x <= q.right && px.y >= q.top && px.y <= q.bottom; };
    return { x: +v.x.toFixed(2), y: +v.y.toFixed(2), under: hit('#mis .mis-rows') || hit('#mis .mis-card') }; });
  let V = null;
  for (let k = 0; k < 20; k++) { await page.waitForTimeout(200); V = await look(); if (Math.abs(V.x) < 0.95 && Math.abs(V.y) < 0.95 && !V.under) break; }
  T.check('the island on the screen upright, not under the panel', Math.abs(V.x) < 0.95 && Math.abs(V.y) < 0.95 && !V.under, JSON.stringify(V));
  d = await drive(page, "r.doc === 'treat' && r.dt > 5", STOP, 0, 60);
  s = await st(page);
  T.check('the treatment on the island (the car still held)', s.run.doc === 'treat' && s.run.locked && /^ZDRAVNIK oskrba \d+ %$/.test(s.rows[2]), JSON.stringify(s.rows));
  d = await drive(page, "r.doc === 'back'", STOP, 0, 90);
  s = await st(page);
  T.check('the doctor back: the car free, the tide on the low road by now', s.run.doc === 'back' && !s.run.locked && / na cesti$/.test(s.rows[0]) && s.rows[2] === 'ZDRAVNIK nazaj v avtu', JSON.stringify({ d, rows: s.rows, lvl: s.run.lvl }));
  // on through the water, past Turn 1 to the dry
  d = await drive(page, 'false', 900, 16, 120);
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('off the low road to the dry: done', s.run.end === 'win' && /MISIJA OPRAVLJENA/.test(s.res), JSON.stringify({ d, run: s.run, res: s.res }));
  T.check('a good run beats the tide in under 2 min', s.run.t < 120, s.run.t.toFixed(1));
  await page.click('#mis-res [data-mis="title"]'); await page.waitForTimeout(600);
  const gone = await page.evaluate((id) => ({ water: !Render.scene.getObjectById(id), tags: !document.getElementById('mis-tags'), run: !Missions.run }), S.wid);
  T.check('back to the title: the water, the island and the tags gone', gone.water && gone.tags && gone.run, JSON.stringify(gone));
  T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
T.done();
