// Special mission 09 · Krilo vetrnice (js/missions/m09.js, the kit js/missions/kit.js) in the browser, upright (360 x 640, touch): ?misija=09
// on Katu-Jaryk; the panel (PROSTOR DO SKALE, ZADNJA OS, KRILO), the keys OS L and OS D, no timing tower; in the scene the tractor's own body
// (the car's hidden), the trailer with the blade drawn behind it, the crags, the escort car; OS D held: the axle turns right and stays; a
// driver down the hairpins turning the axle the side each crag asks: done, the blade whole; a second run with the axle left straight: the
// blade hits the crags (failed). Back to the title: the blade, the crags and the keys gone. No errors on the page.
//   node tests/browser/m09.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('m09');
const srv = await serve();
const browser = await launch();
const ready = (page) => page.waitForFunction(() => window.__game.race && typeof Missions !== 'undefined' && Missions.run && window.__game.phase !== 'none', null, { timeout: 240000 });
const st = (page) => page.evaluate(() => { const g = window.__game, R = g.race, r = Missions.run, m = document.getElementById('mis'), vis = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; };
  return { track: R.track.def.id, run: r && { end: r.end, why: r.why, t: r.t, s: r.P.q.s, hits: r.hits, axle: r.axle }, rows: m ? [...m.querySelectorAll('.mis-row')].map(e => e.innerText.replace(/\s+/g, ' ').trim()) : [],
    keys: vis('#mis-keys') && [...document.querySelectorAll('#mis-keys button')].map(b => b.textContent).join(' '), tower: vis('#tw-strip') || vis('#h-tower'), res: document.getElementById('mis-res') && document.getElementById('mis-res').innerText.replace(/\s+/g, ' ') }; });
// a driver down the centre line at vmax; the axle (moved as the keys move it) turned the side each crag asks in its hairpin (`straight`: left
// straight)
const drive = (page, maxT, vmax, straight) => page.evaluate(([maxT, vmax, straight]) => {
  const g = window.__game, r = Missions.run, Tr = g.race.track, K = r.def.K, t0 = r.t;
  for (let k = 0; k < 40000 && !r.end && r.t - t0 < maxT; k++) {
    const P = r.P, v = Math.hypot(P.vx, P.vz), q = P.q, i = Tr.idx(q.s + 7 + v * 0.4);
    let e = Math.atan2(Tr.pz[i] - P.z, Tr.px[i] - P.x) - P.h; e = Math.atan2(Math.sin(e), Math.cos(e));
    let want = 0; if (!straight) K.PINS.forEach((p, j) => { const s = Tr.startS + p; if (q.s - K.HITCH > s - 60 && q.s - K.HITCH < s + 50) want = K.ROCKS[j][2]; });
    r.axle += Math.max(-K.RATE * 0.05, Math.min(K.RATE * 0.05, want - r.axle));
    g.sim(0.05, false, Math.max(-1, Math.min(1, e * 2.5)), v < vmax ? 1 : 0, v > vmax + 0.8 ? 0.6 : 0);
  }
  return { t: r.t, end: r.end, s: r.P.q.s, hits: r.hits };
}, [maxT, vmax, straight]);
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?misija=09', {}, { width: 360, height: 640 }, { touch: true });
  await ready(page); await page.waitForTimeout(300);
  let s = await st(page);
  T.check('?misija=09: Katu-Jaryk', s.track === 'katu', s.track);
  T.check('the panel: PROSTOR DO SKALE, ZADNJA OS 0, KRILO 100 %; the keys OS L OS D; no timing tower', /^PROSTOR DO SKALE/.test(s.rows[0]) && s.rows[1] === 'ZADNJA OS 0' && s.rows[2] === 'KRILO 100 %' && s.keys === 'OS L OS D' && !s.tower, JSON.stringify(s.rows) + ' ' + s.keys);
  const S = await page.evaluate(() => { const r = Missions.run, v = Render.viewOf(r.P), has = (o) => !!o && !!Render.scene.getObjectById(o.id);
    return { skin: !!r.skin && !!r.skin.parent, body: v.body.visible, tow: has(r.towG), front: has(r.front.g), crags: r.props.filter(o => o.type === 'Group' && o.children.length && o.children[0].isMesh && !o.children[0].material.map).length }; });
  T.check('in the scene: the tractor\'s own body (the car\'s hidden), the trailer with the blade, the escort, the crags', S.skin && !S.body && S.tow && S.front && S.crags >= 1, JSON.stringify(S));
  await page.evaluate(() => { const g = window.__game; for (let k = 0; k < 2000 && Missions.run.t < 0.3; k++) g.sim(0.05, false, 0, 0, 0); });
  await page.evaluate(() => document.querySelector('#mis-keys [data-k="d"]').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 })));
  await page.evaluate(() => { const g = window.__game; for (let k = 0; k < 10; k++) g.sim(0.05, false, 0, 0, 0); });
  const a1 = await page.evaluate(() => { document.querySelector('#mis-keys [data-k="d"]').dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1 })); return Missions.run.axle; });
  await page.evaluate(() => { const g = window.__game; for (let k = 0; k < 10; k++) g.sim(0.05, false, 0, 0, 0); });
  s = await st(page);
  T.check('OS D held (half a second or a little more): the axle turned right, and it stays when let go', a1 >= 0.6 && a1 < 1 && s.run.axle === a1 && /^ZADNJA OS D \d+ %$/.test(s.rows[1]), a1 + ' ' + s.rows[1]);
  await page.evaluate(() => { Missions.run.axle = 0; });
  let d = await drive(page, 590, 5);
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('down the hairpins, the axle turned as each crag asks: done, the blade whole', s.run.end === 'win' && s.run.hits === 0 && /MISIJA OPRAVLJENA/.test(s.res), JSON.stringify({ d, run: s.run, res: s.res }));
  T.check('in time (under the 2 stars\' time)', s.run.t < 480, s.run.t.toFixed(1));
  await page.click('#mis-res [data-mis="again"]'); await ready(page); await page.waitForTimeout(500);
  d = await drive(page, 400, 5, true);
  s = await st(page);
  T.check('the axle left straight: the blade hits the crags, failed', s.run.end === 'fail' && s.run.hits >= 2 && /skalo/.test(s.run.why), JSON.stringify({ d, run: s.run }));
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  const ids = await page.evaluate(() => Missions.run.props.map(o => o.id));
  await page.click('#mis-res [data-mis="title"]'); await page.waitForTimeout(600);
  const gone = await page.evaluate((ids) => ({ things: ids.every(id => !Render.scene.getObjectById(id)), keys: !document.getElementById('mis-keys'), run: !Missions.run }), ids);
  T.check('back to the title: the blade, the crags, the escort and the keys gone', gone.things && gone.keys && gone.run, JSON.stringify(gone));
  T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
T.done();
