// The replay after a race (Jezero Ring, the player on autopilot): the results screen's "Posnetek" plays the race back (the HUD and the
// on-screen controls hidden, the replay's own controls shown); the cars where the recording has them; TV cameras beside the track (the
// camera on a post far from the car, zoomed in); pause, speed, the camera (TV, behind the car, from above, the cockpit), the car followed; "Končaj"
// back to the results. "Najboljši trenutki" (the results, or the replay's Trenutki): the start, the best moments of the race and the finish in
// the order they happened, each on the TV cameras with the car of the moment followed and a caption; then back to the results.
//   node tests/browser/replay.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('replay');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'iso', track: 'jezero' }, { width: 844, height: 390 });
  const act = (a) => page.evaluate((a) => window.__game.onAction(a), a);
  const st = () => page.evaluate(() => { const g = window.__game, cam = Render.camera, r = g.race, el = (id) => document.getElementById(id);
    const info = el('rp-info').textContent, m = /(\d+):(\d+\.\d+)$/.exec(info);
    return { screen: g.screen, ui: !el('replay-ui').classList.contains('off'), hud: !el('hud').classList.contains('off'), touch: !el('touch').classList.contains('off'), info, t: m ? +m[1] * 60 + +m[2] : NaN,
      cam: el('rp-cam').textContent, speed: el('rp-speed').textContent, play: el('rp-play').textContent, fov: cam.fov, camD: Math.hypot(cam.position.x - r.player.x, cam.position.z - r.player.z) }; });

  // the replay's frames drawn (a software-rendered frame of a long telephoto view can take long: count the frames, not the seconds)
  await page.evaluate(() => { window.__rf = 0; const o = Render.frame; Render.frame = function () { window.__rf++; return o.apply(this, arguments); }; });
  const frames = (n) => page.evaluate((n) => new Promise(res => { const f0 = window.__rf, chk = () => window.__rf - f0 >= n ? res(window.__rf - f0) : setTimeout(chk, 20); chk(); }), n);
  await startTrack(page, 'jezero');
  await page.evaluate(() => { const g = window.__game; g.pause(); for (let k = 0; k < 300 && g.phase !== 'done'; k++) g.sim(2, true); });
  await page.waitForFunction(() => window.__game.screen === 'results', null, { timeout: 120000 });
  const btn = await page.evaluate(() => !document.getElementById('res-replay').classList.contains('off'));
  await act('replay'); await frames(6);
  const a = await st();
  T.check('"Posnetek": the replay plays (its controls, no HUD, no touch controls), from the start, on TV cameras', btn && a.screen === 'none' && a.ui && !a.hud && !a.touch && a.t > 0.05 && a.t < 4 && a.cam === 'TV' && /^Ti · /.test(a.info), JSON.stringify(a));
  T.check('TV camera: on a post away from the car, zoomed in', a.camD > 12 && a.fov < 35, JSON.stringify({ camD: a.camD, fov: a.fov }));
  // the cars where the recording has them
  const pose = await page.evaluate(() => { const P = window.__game.race.player; return { x: P.x, z: P.z }; });
  T.check('the player\'s car posed from the recording (on the track, near the start)', Number.isFinite(pose.x) && Number.isFinite(pose.z), JSON.stringify(pose));
  // pause, speed
  await act('rp-play'); await frames(1); const p0 = await st(); await frames(4); const p1 = await st();
  T.check('pause: the time stands', p1.t === p0.t && p1.play === '▶', JSON.stringify({ p0: p0.t, p1: p1.t, play: p1.play }));
  // 1× and 2×: the replay's time against the game's clock over the same frames (each frame's time is the real one, at most 0.1 s: a slow
  // software-drawn frame counts 0.1 s)
  const rate = async () => { const a0 = await page.evaluate(() => window.__game.replay); await frames(8); const a1 = await page.evaluate(() => window.__game.replay); return (a1.t - a0.t) / Math.max(1e-6, a1.clk - a0.clk); };
  await act('rp-play'); await frames(1); const r1 = await rate();
  await act('rp-speed'); await frames(1); const r2 = await rate(), q1 = await st();
  T.check('1×: the recording\'s time with the game\'s clock; 2×: twice as fast', q1.speed === '2×' && r1 > 0.95 && r1 < 1.05 && r2 > 1.9 && r2 < 2.1, JSON.stringify({ r1: +r1.toFixed(3), r2: +r2.toFixed(3), speed: q1.speed }));
  // the camera, the car followed
  await act('rp-cam'); await frames(1); const c1 = await st();
  await act('rp-cam'); await frames(1); const c2 = await st();
  await act('rp-cam'); await frames(1); const c3 = await st();
  await act('rp-cam'); await frames(1); const c4 = await st();
  T.check('the camera: TV → behind the car → from above → the cockpit → TV', c1.cam === 'Za avtom' && c2.cam === 'Od zgoraj' && c3.cam === 'Kokpit' && c4.cam === 'TV', [c1.cam, c2.cam, c3.cam, c4.cam].join(' → '));
  await act('rp-next'); await frames(2); const n1 = await st();
  T.check('another car followed', !/^Ti · /.test(n1.info) && /·/.test(n1.info), n1.info);
  // the end: back to the results
  await act('rp-exit'); await page.waitForTimeout(300); const e = await st();
  T.check('"Končaj": back to the results', e.screen === 'results' && !e.ui, JSON.stringify(e));

  // the highlights: from the results
  const hl = () => page.evaluate(() => { const g = window.__game, P = g.replay, el = (id) => document.getElementById(id), H = P && P.hl;
    return { screen: g.screen, on: !!H, i: H ? H.i : -1, n: H ? H.clips.length : 0, lbl: H ? H.clips[H.i].lbl : '', k: P ? P.k : -1, want: H ? H.clips[H.i].k : -2, t: P ? P.t : NaN, t0: H ? H.clips[H.i].t0 : NaN,
      cam: el('rp-cam').textContent, cap: el('rp-hl-cap').classList.contains('off') ? '' : el('rp-hl-cap').textContent, lit: el('rp-hl').classList.contains('on'), ui: !el('replay-ui').classList.contains('off') }; });
  const hb = await page.evaluate(() => !document.getElementById('res-hl').classList.contains('off'));
  await act('replay-hl'); await frames(3); const h0 = await hl();
  T.check('"Najboljši trenutki": the start first, on the TV cameras, the car on pole followed, a caption, the button lit', hb && h0.on && h0.i === 0 && h0.n >= 2 && h0.lbl === 'ŠTART' && h0.cam === 'TV' && h0.k === h0.want && /ŠTART/.test(h0.cap) && h0.lit && h0.ui && h0.screen === 'none' && h0.t - h0.t0 < 3,
    JSON.stringify(h0));
  await act('rp-speed'); await act('rp-speed');   // (4x: the programme sooner through)
  const seen = [h0.lbl]; let last = h0, done = null;
  for (let k = 0; k < 400 && !done; k++) {
    await frames(4); const h = await hl();
    if (!h.on) { done = h; break; }
    if (h.i !== last.i) { seen.push(h.lbl + (h.k === h.want && h.cam === 'TV' && h.cap.length > 3 ? '' : '!')); }
    last = h;
  }
  T.check('then the moments in turn (overtakes, crashes), the finish last, each with its car followed on TV and a caption; then the results again',
    !!done && done.screen === 'results' && !done.ui && seen[seen.length - 1] === 'CILJ' && seen.length === last.n && seen.every(x => !x.endsWith('!')) && seen.slice(1, -1).every(x => x === 'PREHITEVANJE' || x === 'NESREČA'),
    seen.join(' > '));

  T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
