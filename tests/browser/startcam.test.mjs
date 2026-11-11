// The camera before the start (Render.startCamGo, game.js startCamPick): while the field waits on the grid the camera flies one of six
// flights, picked at random, never the last race's, each with its own start lights on the HUD (#h-lights.sc1..sc6): 1 the drone back from the
// gantry, 2 the drone jumping round the car at every light, 3 the helicopter circling, 4 the helicopter over the first corner, 5 the
// aeroplane's pass and banked turn, 6 the drone out of the pits (only on a track with pits); where the world films its own intro (the jets:
// Styria, Bathurst, Rio) that intro is one more of them. The intro 3 s, the lights at 3.0 s + 0.8 s each; never closer to the player's car
// than the chase view with Oddaljenost: Blizu nor lower than it (landscape; upright Srednje's, the old Blizu, since the upright chase view
// came closer on 11. 11. 2026: with Blizu the flight comes down to it over its last 0.8 s), the chase view itself by the 5th light (6.4 s, the
// drone of the lights 6.6 s), off at the start. Not in a time trial or from a flying start; the tests' own default (tdgp-nostartcam): off.
//   node tests/browser/startcam.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('camera before the start');
const srv = await serve();
const browser = await launch();
// one flight, stepped by hand from the race's start (restarted paused, Math.random seeded): the camera every 0.1 s, the phases, the lights
const fly = (page, v) => page.evaluate((v) => {
  const g = window.__game, $ = (id) => document.getElementById(id);
  g.startCamForce(v); g.onAction('restart'); g.pause(); g.sim(1 / 60, true);
  const P = g.race.player, B = [P.x, P.y, P.z], o = { v: g.startCam.v, cls: $('h-lights').className, lim: g.startCam.lim, minD: 1e9, minH: 1e9, lights: [], end: null, off: null };
  const cam = () => { Render.frame(1 / 60, 1, P, 'chase', {}); const c = Render.camera.position; return [c.x, c.y, c.z]; };
  let t = 0, ph = g.phase, lit = 0;
  for (let k = 0; k < 120 && g.phase !== 'racing'; k++) {
    for (let n = 0; n < 12; n++) g.sim(1 / 120, true);   // (0.1 s: twelve of the game's steps, one per call)
    t = g.startCam.t || t + 0.1;
    const c = cam(), d = Math.hypot(c[0] - B[0], c[1] - B[1], c[2] - B[2]);
    o.minD = Math.min(o.minD, d); o.minH = Math.min(o.minH, c[1] - B[1]);
    if (g.phase !== ph) { o.lights.push(g.phase + '@' + t.toFixed(1)); ph = g.phase; }
    const n = $('h-lights').querySelectorAll('i.on').length; if (n !== lit) { o.lights.push(n + '@' + t.toFixed(1)); lit = n; }
    if (o.end == null && g.startCam.t >= 6.7 && g.phase === 'lights') {   // (past the 5th light: the camera as the chase view without the flight)
      const a = cam(), q = Render.camera.quaternion.clone(), was = Render.startCam.v; Render.startCamStop(); const b = cam(), qb = Render.camera.quaternion.clone();
      o.end = { gap: +Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]).toFixed(3), rot: +q.angleTo(qb).toFixed(4) }; Render.startCamGo(was); Render.startCam.t = 6.7;
      o.chase = { d: +Math.hypot(b[0] - B[0], b[1] - B[1], b[2] - B[2]).toFixed(2), h: +(b[1] - B[1]).toFixed(2) };   // (the chase view itself: its distance from the car, its height over it)
    }
  }
  o.off = { phase: g.phase, v: g.startCam.v, rv: Render.startCam.v };
  o.minD = +o.minD.toFixed(2); o.minH = +o.minH.toFixed(2); o.lim = { d: +o.lim.d.toFixed(2), h: +o.lim.h.toFixed(2) };
  g.resume(); return o;
}, v);
// the lamps' and the panel's look (computed style), and the panel's width, for each style
const looks = (page) => page.evaluate(() => {
  const L = document.getElementById('h-lights'), was = L.className, out = {};
  for (const c of ['', 'sc1', 'sc2', 'sc3', 'sc4', 'sc5', 'sc6']) {
    L.className = 'show ' + c; const i = L.children[0], s = getComputedStyle(i), p = getComputedStyle(L);
    out[c || 'base'] = { sig: [s.width, s.height, s.borderRadius, s.transform, s.backgroundImage, s.backgroundColor, s.borderTopWidth, p.borderRadius, p.backgroundImage, p.borderTopWidth].join('|'), w: L.getBoundingClientRect().width };
  }
  L.className = was; return out;
});
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html?proga=spa', { quality: 'normal', shadows: 0, camera: 'chase', zoom: 1.1 }, { width: 640, height: 360 }, { seed: 7, startCam: true });
  await page.waitForFunction(() => window.__game.quick && window.__game.quick.done && window.__game.race, null, { timeout: 300000 });
  // every flight on Spa (pits, no jets of its own), landscape
  for (const v of [1, 2, 3, 4, 5, 6]) {
    const r = await fly(page, v), lt = r.lights.join(' '), end = v === 2 ? 6.6 : 6.4;
    T.check(`Spa, flight ${v}: picked, its own start lights (sc${v})`, r.v === v && r.cls.split(' ').includes('sc' + v), JSON.stringify({ v: r.v, cls: r.cls }));
    T.check(`Spa, flight ${v}: the intro 3 s, then the lights one every 0.8 s`, /^lights@3\.[01] 1@3\.[01] 2@3\.[89] 3@4\.[67] 4@5\.[45] 5@6\.[23]/.test(lt), lt);
    T.check(`Spa, flight ${v}: never closer than the Blizu chase view (${r.lim.d} m) nor lower (${r.lim.h} m)`, r.minD >= r.lim.d - 0.05 && r.minH >= r.lim.h - 0.05, `closest ${r.minD} m, lowest ${r.minH} m`);
    T.check(`Spa, flight ${v}: the chase view itself by the 5th light (${end} s), off at the start`, r.end && r.end.gap < 0.05 && r.end.rot < 0.002 && r.off.phase === 'racing' && r.off.v === 0 && r.off.rv === 0, JSON.stringify({ end: r.end, off: r.off }));
  }
  // upright: the limit of the upright chase view (higher, farther), the old Blizu's: Srednje's since the upright chase view came closer (the
  // user, 11. 11. 2026; the flights as they were); with Blizu, closer, the flight as at Srednje, over its last 0.8 s down to the chase view
  await page.setViewportSize({ width: 360, height: 640 }); await page.waitForTimeout(300); await page.evaluate(() => Render.resize());   // (paused: the game's own resize waits for a frame)
  for (const [v, z] of [[2, 1.4], [6, 1.4], [2, 1.1], [6, 1.1]]) {
    await page.evaluate((z) => { __game.S.zoom = z; Render.cam.userZoom = z; }, z);
    const r = await fly(page, v), mid = z === 1.4;
    T.check(mid ? `Spa upright, flight ${v}, Srednje: never closer nor lower than the upright chase view (the old Blizu's), the chase view by the 5th light`
      : `Spa upright, flight ${v}, Blizu: never closer nor lower than its chase view (closer than Srednje's), down to it by the 5th light`,
      r.lim.d > 35 && r.chase && (mid ? Math.abs(r.chase.d - r.lim.d) < 0.3 && r.minD >= r.lim.d - 0.05 && r.minH >= r.lim.h - 0.05 : r.chase.d < r.lim.d - 3 && r.minD >= r.chase.d - 0.05 && r.minH >= r.chase.h - 0.05) && r.end && r.end.gap < 0.05,
      JSON.stringify({ lim: r.lim, chase: r.chase, minD: r.minD, minH: r.minH, end: r.end }));
  }
  await page.evaluate(() => { __game.S.zoom = 1.1; Render.cam.userZoom = 1.1; });
  // the six start lights: each its own look, none like the usual ones, none wider than them (landscape and upright)
  const up = await looks(page); await page.setViewportSize({ width: 640, height: 360 }); await page.waitForTimeout(300); const side = await looks(page);
  const sigs = Object.values(side).map(o => o.sig), wide = [side, up].flatMap(L => Object.entries(L).filter(([k, o]) => o.w > L.base.w + 0.5).map(([k, o]) => k + ' ' + o.w.toFixed(1) + ' > ' + L.base.w.toFixed(1)));
  T.check('the six start lights: each its own look, none like the usual ones', new Set(sigs).size === 7, JSON.stringify(Object.fromEntries(Object.entries(side).map(([k, o]) => [k, o.sig]))));
  T.check('the six start lights: none wider than the usual ones (landscape and upright)', wide.length === 0, wide.join(', '));
  // at random: never the same twice in a row; Spa: the one out of the pits among them, no jets
  // (n draws, then on until every one of `want` has come up, at most 150: a fixed 24 drew all six flights only 97 % of the time, and the
  // jets one more among seven only 99 % of the time, so about 1 run in 25 failed on chance alone; the 150 are missed about once in 10^12)
  const picks = async (n, want = []) => page.evaluate(async ([n, want]) => { const g = window.__game, out = []; g.startCamForce(0); for (let k = 0; k < 150 && (k < n || !want.every(v => out.includes(v))); k++) { g.onAction('restart'); g.pause(); out.push(g.startCam.v); } g.resume(); return out; }, [n, want]);
  let p = await picks(24, [1, 2, 3, 4, 5, 6]);
  T.check('Spa: at random, never the same twice in a row, all six of them', p.every((v, k) => k === 0 || v !== p[k - 1]) && [1, 2, 3, 4, 5, 6].every(v => p.includes(v)) && !p.includes(0), p.join(''));
  // a track without pits (Suzuka): never the one out of the pits, not even asked for
  await startTrack(page, 'suzuka', null);
  p = await picks(18);
  const s6 = await page.evaluate(() => { const g = window.__game; g.startCamForce(6); g.onAction('restart'); g.pause(); const v = g.startCam.v; g.startCamForce(0); g.resume(); return v; });
  T.check('Suzuka (no pits): never the one out of the pits', !p.includes(6) && !p.includes(0) && s6 !== 6 && s6 > 0 && p.every((v, k) => k === 0 || v !== p[k - 1]), p.join('') + ' asked for 6: ' + s6);
  // Bathurst (its own jets): the jets one more of them (0: no flight, the jets' shot and the usual lights; air.go stays set between restarts
  // with no frame between them, so only the shot and the lights say a flight was not the jets)
  await startTrack(page, 'bathurst', null);
  const j = await page.evaluate(() => { const g = window.__game, out = []; g.startCamForce(0); for (let k = 0; k < 150 && (k < 24 || !out.some(o => o.v === 0)); k++) { g.onAction('restart'); g.pause(); out.push({ v: g.startCam.v, jets: !!(Render.world.air && Render.world.air.go), cls: document.getElementById('h-lights').className, shot: document.getElementById('hud').classList.contains('shot') }); } g.resume(); return out; });
  T.check('Bathurst (its own jets): the jets one more of them, with their shot and the usual lights', j.some(o => o.v === 0) && j.filter(o => o.v === 0).every(o => o.jets && o.shot && !/sc\d/.test(o.cls)) && j.filter(o => o.v > 0).every(o => !o.shot && o.cls.includes('sc' + o.v)) && j.every((o, k) => k === 0 || o.v !== j[k - 1].v),
    j.map(o => o.v).join(''));
  // no flight in a time trial or from a flying start
  for (const [id, mode] of [['vrsic', 'tt'], ['vrsic', 'race']]) {
    await startTrack(page, id, mode);
    const r = await page.evaluate(() => { const g = window.__game; return { v: g.startCam.v, fly: g.race.opts.flying || 0, tt: !!g.race.timeTrial, cls: document.getElementById('h-lights').className }; });
    T.check(`${id} (${mode}): no flight before the start`, r.v === 0 && !/sc\d/.test(r.cls), JSON.stringify(r));
  }
  T.check('no errors on the page', errors.length === 0, errors.slice(0, 5).join(' | '));
  await page.context().close();
  // the tests' own default (tdgp-nostartcam): no flight, the 1.3 s intro as ever
  { const { page, errors } = await openGame(browser, srv.base + '/index.html?proga=spa', { quality: 'normal', shadows: 0, camera: 'chase' }, { width: 640, height: 360 }, { seed: 7 });
    await page.waitForFunction(() => window.__game.quick && window.__game.quick.done && window.__game.race, null, { timeout: 300000 });
    const r = await page.evaluate(() => { const g = window.__game; g.onAction('restart'); g.pause(); const v = g.startCam.v; let n = 0; while (g.phase === 'intro' && n < 600) { g.sim(1 / 120, true); n++; } g.resume(); return { v, t: +(n / 120).toFixed(2) }; });
    T.check('the tests\' default: no flight, the lights after the usual 1.3 s', r.v === 0 && r.t >= 1.3 && r.t <= 1.4, JSON.stringify(r));
    T.check('no errors on the page (default)', errors.length === 0, errors.slice(0, 5).join(' | '));
    await page.context().close(); }
} finally {
  await browser.close(); await srv.close();
}
T.done();
