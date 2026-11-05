// Special mission 43 · Vroče zavore (js/missions/m43.js, the kit js/missions/kit.js) in the browser, upright (360 x 640, touch): ?misija=43
// on Rio do Rastro, the truck at the top facing down; the panel (ZAVORE, PRESTAVA, DO DOLINE), the keys NIŽJE and VIŠJE, no timing tower,
// no WRONG WAY; the truck's own body (the car's hidden), the escape lanes' sand; VIŠJE and NIŽJE pressed: the gear up and down; a driver
// down the hairpins with the gear to the bends: done; a second run in 5th riding the brakes: they overheat and it leaves the road (failed).
// Back to the title: the keys and the sand gone. No errors on the page.
//   node tests/browser/m43.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('m43');
const srv = await serve();
const browser = await launch();
const ready = (page) => page.waitForFunction(() => window.__game.race && typeof Missions !== 'undefined' && Missions.run && window.__game.phase !== 'none', null, { timeout: 240000 });
const st = (page) => page.evaluate(() => { const g = window.__game, R = g.race, r = Missions.run, m = document.getElementById('mis'), vis = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; };
  return { track: R.track.def.id, run: r && { end: r.end, why: r.why, t: r.t, s: r.P.q.s, gear: r.gear, heat: r.br.heat, gone: r.gone }, rows: m ? [...m.querySelectorAll('.mis-row')].map(e => e.innerText.replace(/\s+/g, ' ').trim()) : [],
    keys: vis('#mis-keys') && [...document.querySelectorAll('#mis-keys button')].map(b => b.textContent).join(' '), tower: vis('#tw-strip') || vis('#h-tower'), wrong: vis('#h-wrong') || /NAPAČNA|WRONG/.test(document.getElementById('hud').innerText),
    res: document.getElementById('mis-res') && document.getElementById('mis-res').innerText.replace(/\s+/g, ' ') }; });
const key = (page, k) => page.evaluate((k) => { const b = document.querySelector('#mis-keys [data-k="' + k + '"]'); b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 })); b.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1 })); }, k);
// a driver down the road (the other way: steered at a point behind on the road, 1.5 m right of the centre line, clear of the sand); the
// speed under sqrt(al x the radius of the tightest bend 0-45 m on) and vmax; the gear: `gear` held, else the lowest whose top is over the
// speed wanted (one shift every 0.6 s)
const drive = (page, maxT, vmax, al, gear) => page.evaluate(([maxT, vmax, al, gear]) => {
  const g = window.__game, r = Missions.run, Tr = g.race.track, K = r.def.K, t0 = r.t; let last = -1, gone = false;
  const bend = (s) => { const i = Tr.idx(s - 6), j = Tr.idx(s + 6); let a = Math.atan2(Tr.tz[j], Tr.tx[j]) - Math.atan2(Tr.tz[i], Tr.tx[i]); return Math.abs(Math.atan2(Math.sin(a), Math.cos(a)) / 12); };
  for (let k = 0; k < 40000 && !r.end && r.t - t0 < maxT; k++) {
    const P = r.P, v = Math.hypot(P.vx, P.vz), q = P.q, i = Tr.idx(q.s - 10 - v * 0.4), x = Tr.px[i] + Tr.nx[i] * 1.5, z = Tr.pz[i] + Tr.nz[i] * 1.5;
    let e = Math.atan2(z - P.z, x - P.x) - P.h; e = Math.atan2(Math.sin(e), Math.cos(e));
    let kM = 0; for (let u = 0; u <= 45; u += 5) kM = Math.max(kM, bend(q.s - u));
    const vT = Math.min(vmax, Math.sqrt(al / Math.max(kM, 1e-4)));
    let want = gear || K.VG.findIndex(x => x >= vT * 3.6 + 3) + 1; if (want < 1) want = K.VG.length;
    if (want !== r.gear && r.t - last > 0.6) { r.def.shift(r, want < r.gear ? -1 : 1); last = r.t; }
    g.sim(0.05, false, Math.max(-1, Math.min(1, e * 2.5)), v < vT - 0.5 ? 1 : 0, v > vT + 0.8 ? Math.min(1, (v - vT) / 3) : 0);
    if (r.gone) gone = true;
  }
  return { t: r.t, end: r.end, s: r.P.q.s, gone };
}, [maxT, vmax, al, gear]);
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?misija=43', {}, { width: 360, height: 640 }, { touch: true });
  await ready(page); await page.waitForTimeout(300);
  let s = await st(page);
  T.check('?misija=43: Rio do Rastro', s.track === 'rastro', s.track);
  T.check('the panel: ZAVORE 0 %, PRESTAVA 3, DO DOLINE 3,1 km; the keys NIŽJE VIŠJE; no timing tower', s.rows[0] === 'ZAVORE 0 %' && s.rows[1] === 'PRESTAVA 3' && s.rows[2] === 'DO DOLINE 3,1 km' && s.keys === 'NIŽJE VIŠJE' && !s.tower, JSON.stringify(s.rows) + ' ' + s.keys);
  const S = await page.evaluate(() => { const r = Missions.run, v = Render.viewOf(r.P), bands = r.props.filter(o => o.isMesh && o.material && o.material.map).length; return { skin: !!r.skin && !!r.skin.parent, body: v.body.visible, bands }; });
  T.check('the truck\'s own body (the car\'s hidden), the escape lanes\' sand', S.skin && !S.body && S.bands >= 3, JSON.stringify(S));
  await page.evaluate(() => { const g = window.__game; for (let k = 0; k < 2000 && Missions.run.t < 0.3; k++) g.sim(0.05, false, 0, 0, 0); });
  // (a press is taken at the mission's next step: simulated here, not left to the real frames between two evaluates, which a busy machine may not run)
  await key(page, 'up'); await page.evaluate(() => { const g = window.__game; for (let k = 0; k < 4; k++) g.sim(0.05, false, 0, 0, 0); }); s = await st(page); const up = s.run.gear;
  await key(page, 'dn'); await key(page, 'dn'); await page.evaluate(() => { const g = window.__game; for (let k = 0; k < 4; k++) g.sim(0.05, false, 0, 0, 0); }); s = await st(page);
  T.check('VIŠJE: 4th; NIŽJE twice (standing): 2nd', up === 4 && s.run.gear === 2 && s.rows[1] === 'PRESTAVA 2', `${up} ${s.run.gear}`);
  let d = await drive(page, 415, 20, 4);
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('down the hairpins, the gear to the bends: done, the brakes never gone, no WRONG WAY', s.run.end === 'win' && /MISIJA OPRAVLJENA/.test(s.res) && !d.gone && !s.wrong, JSON.stringify({ d, run: s.run, res: s.res }));
  T.check('in time (under the 2 stars\' time)', s.run.t < 345, s.run.t.toFixed(1));
  await page.click('#mis-res [data-mis="again"]'); await ready(page); await page.waitForTimeout(500);
  d = await drive(page, 400, 16, 3.5, 5);
  s = await st(page);
  T.check('in 5th riding the brakes: they overheat (gone) and the truck leaves the road: failed', s.run.end === 'fail' && d.gone && /zletel|ušel/.test(s.run.why), JSON.stringify({ d, run: s.run }));
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  const ids = await page.evaluate(() => Missions.run.props.map(o => o.id));
  await page.click('#mis-res [data-mis="title"]'); await page.waitForTimeout(600);
  const gone = await page.evaluate((ids) => ({ things: ids.every(id => !Render.scene.getObjectById(id)), keys: !document.getElementById('mis-keys'), run: !Missions.run }), ids);
  T.check('back to the title: the sand, the signs and the keys gone', gone.things && gone.keys && gone.run, JSON.stringify(gone));
  T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
T.done();
