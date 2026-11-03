// Special mission 51 · Dinozaver na tovornjaku (js/missions/m51.js, the kit js/missions/kit.js) in the browser, upright (360 x 640, touch):
// ?misija=51 on Crystal Palace; the panel (VIŠINA TOVORA, PROSTOR, DINOZAVER), the button SPUSTI PODVOZJE, no timing tower; in the scene the
// low-loader's own body with the statue (the car's hidden), the railway bridge, the trees, the parked cars; a driver round the lap down the
// middle under the trees, the bed lowered before the bridge (the button pressed) and raised past it: done. A second run raised into the
// bridge: failed. Back to the title: the mission's things and its button gone. No errors on the page.
//   node tests/browser/m51.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('m51');
const srv = await serve();
const browser = await launch();
const ready = (page) => page.waitForFunction(() => window.__game.race && typeof Missions !== 'undefined' && Missions.run && window.__game.phase !== 'none', null, { timeout: 240000 });
const st = (page) => page.evaluate(() => { const g = window.__game, R = g.race, r = Missions.run, m = document.getElementById('mis'), vis = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; };
  return { track: R.track.def.id, run: r && { end: r.end, why: r.why, t: r.t, hp: r.hp, low: r.low, s: r.P.q.s }, rows: m ? [...m.querySelectorAll('.mis-row')].map(e => e.innerText.replace(/\s+/g, ' ').trim()) : [],
    btn: vis('#mis-btn') && document.getElementById('mis-btn').textContent, tower: vis('#tw-strip') || vis('#h-tower'), res: document.getElementById('mis-res') && document.getElementById('mis-res').innerText.replace(/\s+/g, ' ') }; });
const press = (page) => page.evaluate(() => { const b = document.getElementById('mis-btn'); b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 })); b.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1 })); });
// a driver: the autopilot's steering, under the trees and by the parked cars held to the middle; the gas on and off to hold vmax; the bed
// lowered 60 m before the bridge and raised 30 m past it (a press of the button, unless `raised`); until the end
const drive = (page, maxT, vmax, raised) => page.evaluate(([maxT, vmax, raised]) => {
  const g = window.__game, r = Missions.run, Tr = g.race.track, K = r.def.K, sB = Tr.startS + K.BRIDGE, t0 = r.t, b = document.getElementById('mis-btn');
  const tap = () => { b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 })); b.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1 })); };
  for (let k = 0; k < 40000 && !r.end && r.t - t0 < maxT; k++) {
    const P = r.P, v = Math.hypot(P.vx, P.vz), s = P.q.s;
    Core.aiControl(P, g.race, 0.05);
    let st = P.inSteer * (P.gear < 0 ? -1 : 1);
    const near = K.TREES.some(t => Math.abs(Tr.startS + t - s) < K.TL / 2 + 40) || r.cars.some(c => Math.abs(c.s - s) < 40) || Math.abs(sB - s) < 40;
    if (near) { const i = Tr.idx(s + 9), x = Tr.px[i], z = Tr.pz[i]; let e = Math.atan2(z - P.z, x - P.x) - P.h; e = Math.atan2(Math.sin(e), Math.cos(e)); st = Math.max(-1, Math.min(1, e * 2.5 - P.q.d * 0.08)); }
    if (!raised && !r.low && sB - s < 60 && sB - s > 0) tap();
    if (r.low && s > sB + 30) tap();
    let thr = 0, brk = 0; if (P.inBrk > 0.3) brk = P.inBrk; else if (v < vmax) thr = 1;
    g.sim(0.05, false, st, thr, brk);
  }
  return { t: r.t, end: r.end, s: r.P.q.s, hp: r.hp };
}, [maxT, vmax, raised]);
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?misija=51', {}, { width: 360, height: 640 }, { touch: true });
  await ready(page); await page.waitForTimeout(300);
  let s = await st(page);
  T.check('?misija=51: Crystal Palace', s.track === 'cpalace', s.track);
  T.check('the panel: VIŠINA TOVORA 4,6 m, PROSTOR, DINOZAVER 100 %; the button SPUSTI PODVOZJE; no timing tower', s.rows[0] === 'VIŠINA TOVORA 4,6 m' && /^PROSTOR/.test(s.rows[1]) && s.rows[2] === 'DINOZAVER 100 %' && s.btn === 'SPUSTI PODVOZJE' && !s.tower, JSON.stringify(s.rows) + ' ' + s.btn);
  const S = await page.evaluate(() => { const r = Missions.run, v = Render.viewOf(r.P), n = r.props.filter(o => o.type === 'Group' && o.children.length && !!Render.scene.getObjectById(o.id)).length;
    return { skin: !!r.skin && !!r.skin.parent, dino: !!r.dino && r.dino.parent === r.skin, body: v.body.visible, n }; });
  T.check('in the scene: the low-loader with the statue (the car\'s hidden), the bridge, four groups of trees, the parked cars', S.skin && S.dino && !S.body && S.n >= 6, JSON.stringify(S));
  await page.evaluate(() => { const g = window.__game; for (let k = 0; k < 2000 && Missions.run.t < 0.3; k++) g.sim(0.05, false, 0, 0, 0); });
  // a press lowers, another raises
  await press(page); await page.evaluate(() => { const g = window.__game; for (let k = 0; k < 40; k++) g.sim(0.05, false, 0, 0, 0); });
  s = await st(page);
  T.check('SPUSTI PODVOZJE: lowered to 4,2 m, the button now DVIGNI PODVOZJE', s.run.low && s.rows[0] === 'VIŠINA TOVORA 4,2 m ↓' && s.btn === 'DVIGNI PODVOZJE', s.rows[0] + ' ' + s.btn);
  await press(page); await page.evaluate(() => { const g = window.__game; for (let k = 0; k < 40; k++) g.sim(0.05, false, 0, 0, 0); });
  s = await st(page);
  T.check('pressed again: raised', !s.run.low && s.rows[0] === 'VIŠINA TOVORA 4,6 m', s.rows[0]);
  // the lap
  let d = await drive(page, 470, 12);
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  s = await st(page);
  T.check('round the lap, lowered under the bridge, down the middle under the trees: done', s.run.end === 'win' && /MISIJA OPRAVLJENA/.test(s.res), JSON.stringify({ d, run: s.run, res: s.res }));
  T.check('the statue whole, in time (under the 2 stars\' time)', s.run.hp >= 0.75 && s.run.t < 380, JSON.stringify(s.run));
  await page.click('#mis-res [data-mis="again"]'); await ready(page); await page.waitForTimeout(500);
  d = await drive(page, 300, 12, true);
  s = await st(page);
  T.check('raised into the bridge: failed', s.run.end === 'fail' && /most/.test(s.run.why), JSON.stringify({ d, run: s.run }));
  await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 });
  const ids = await page.evaluate(() => Missions.run.props.map(o => o.id));
  await page.click('#mis-res [data-mis="title"]'); await page.waitForTimeout(600);
  const gone = await page.evaluate((ids) => ({ things: ids.every(id => !Render.scene.getObjectById(id)), btn: !document.getElementById('mis-btn'), run: !Missions.run }), ids);
  T.check('back to the title: the bridge, the trees, the cars and the button gone', gone.things && gone.btn && gone.run, JSON.stringify(gone));
  T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
T.done();
